"""Image utility functions with performance optimizations."""
import cv2
import numpy as np
import base64
import io
import hashlib
from functools import lru_cache
from typing import Optional, Dict, Any, Tuple
from PIL import Image
import threading
import os

# Thread-safe image cache
_image_cache = {}
_cache_lock = threading.Lock()
_MAX_CACHE_SIZE = 50  # Maximum number of cached images
_MAX_CACHE_BYTES = 500 * 1024 * 1024  # 500MB max cache size
_cache_size_bytes = 0


def _get_cache_key(filepath: str) -> str:
    """Generate cache key from filepath."""
    stat = os.stat(filepath)
    return f"{filepath}_{stat.st_mtime}_{stat.st_size}"


def _evict_cache_if_needed(new_size: int) -> None:
    """Evict oldest cache entries if needed."""
    global _cache_size_bytes
    with _cache_lock:
        while (_cache_size_bytes + new_size > _MAX_CACHE_BYTES or 
               len(_image_cache) >= _MAX_CACHE_SIZE) and _image_cache:
            oldest_key = next(iter(_image_cache))
            old_img = _image_cache.pop(oldest_key)
            _cache_size_bytes -= old_img.nbytes


def load_image(filepath: str, use_cache: bool = True) -> Optional[np.ndarray]:
    """
    Load an image from file with optional caching.
    
    Args:
        filepath: Path to the image file
        use_cache: Whether to use image cache (default True)
    
    Returns:
        Image as numpy array (BGR format) or None if failed
    """
    global _cache_size_bytes
    try:
        if use_cache:
            cache_key = _get_cache_key(filepath)
            with _cache_lock:
                if cache_key in _image_cache:
                    return _image_cache[cache_key].copy()
        
        # Use IMREAD_COLOR for consistent format
        image = cv2.imread(filepath, cv2.IMREAD_COLOR)
        
        if image is not None and use_cache:
            img_size = image.nbytes
            _evict_cache_if_needed(img_size)
            cache_key = _get_cache_key(filepath)
            with _cache_lock:
                _image_cache[cache_key] = image.copy()
                _cache_size_bytes += img_size
        
        return image
    except Exception:
        return None


def save_image(image: np.ndarray, filepath: str, quality: int = 95) -> bool:
    """
    Save an image to file.
    
    Args:
        image: Image as numpy array
        filepath: Destination path
        quality: JPEG quality (0-100)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        extension = filepath.rsplit('.', 1)[-1].lower()
        
        if extension in ['jpg', 'jpeg']:
            cv2.imwrite(filepath, image, [cv2.IMWRITE_JPEG_QUALITY, quality])
        elif extension == 'png':
            cv2.imwrite(filepath, image, [cv2.IMWRITE_PNG_COMPRESSION, 6])
        else:
            cv2.imwrite(filepath, image)
        
        return True
    except Exception:
        return False


def image_to_base64(image: np.ndarray, format: str = 'auto', quality: int = 85) -> str:
    """
    Convert numpy image to base64 string with optimized compression.
    
    Args:
        image: Image as numpy array
        format: Output format ('png', 'jpeg', 'auto'). 'auto' chooses based on image size
        quality: JPEG quality (1-100), default 85 for good balance
    
    Returns:
        Base64 encoded string with data URL prefix
    """
    # Auto-select format based on image size for performance
    if format == 'auto':
        # Use JPEG for larger images (faster encoding, smaller size)
        pixels = image.shape[0] * image.shape[1]
        format = 'jpeg' if pixels > 500000 else 'png'  # ~700x700 threshold
    
    # Use OpenCV for faster encoding
    if format.lower() in ['jpg', 'jpeg']:
        encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
        _, buffer = cv2.imencode('.jpg', image, encode_params)
        mime_type = 'image/jpeg'
    else:
        # PNG with fast compression
        encode_params = [cv2.IMWRITE_PNG_COMPRESSION, 3]  # 0-9, lower is faster
        _, buffer = cv2.imencode('.png', image, encode_params)
        mime_type = 'image/png'
    
    base64_data = base64.b64encode(buffer).decode('utf-8')
    return f"data:{mime_type};base64,{base64_data}"


def base64_to_image(base64_string: str) -> Optional[np.ndarray]:
    """
    Convert base64 string to numpy image.
    
    Args:
        base64_string: Base64 encoded image (with or without data URL prefix)
    
    Returns:
        Image as numpy array or None if failed
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return image
    except Exception:
        return None


def get_image_info(filepath: str) -> Dict[str, Any]:
    """
    Get information about an image file.
    
    Args:
        filepath: Path to the image file
    
    Returns:
        Dictionary with image information
    """
    try:
        image = cv2.imread(filepath)
        
        if image is None:
            return {'error': 'Failed to load image'}
        
        height, width = image.shape[:2]
        channels = image.shape[2] if len(image.shape) > 2 else 1
        
        # Determine format from file
        extension = filepath.rsplit('.', 1)[-1].lower()
        format_map = {
            'jpg': 'JPEG',
            'jpeg': 'JPEG',
            'png': 'PNG',
            'gif': 'GIF',
            'bmp': 'BMP',
            'tiff': 'TIFF',
            'tif': 'TIFF'
        }
        
        return {
            'width': width,
            'height': height,
            'channels': channels,
            'format': format_map.get(extension, extension.upper()),
            'color_mode': 'RGB' if channels == 3 else 'Grayscale'
        }
    except Exception as e:
        return {'error': str(e)}


def resize_image(image: np.ndarray, max_dimension: int = 1024, 
                 fast_mode: bool = False) -> np.ndarray:
    """
    Resize image if it exceeds maximum dimension while maintaining aspect ratio.
    
    Args:
        image: Input image
        max_dimension: Maximum width or height
        fast_mode: Use faster but lower quality interpolation
    
    Returns:
        Resized image (or original if within limits)
    """
    height, width = image.shape[:2]
    
    if max(height, width) <= max_dimension:
        return image
    
    scale = max_dimension / max(height, width)
    new_width = int(width * scale)
    new_height = int(height * scale)
    
    # Choose interpolation based on scaling direction and mode
    if fast_mode:
        interpolation = cv2.INTER_NEAREST
    elif scale < 1:
        interpolation = cv2.INTER_AREA  # Best for downscaling
    else:
        interpolation = cv2.INTER_LINEAR  # Good for upscaling
    
    return cv2.resize(image, (new_width, new_height), interpolation=interpolation)


def resize_for_processing(image: np.ndarray, max_pixels: int = 2000000) -> Tuple[np.ndarray, float]:
    """
    Resize image for faster processing, return scale factor for later upscaling.
    
    Args:
        image: Input image
        max_pixels: Maximum number of pixels (default ~1400x1400)
    
    Returns:
        Tuple of (resized_image, scale_factor)
    """
    height, width = image.shape[:2]
    pixels = height * width
    
    if pixels <= max_pixels:
        return image, 1.0
    
    scale = np.sqrt(max_pixels / pixels)
    new_size = (int(width * scale), int(height * scale))
    resized = cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)
    
    return resized, scale


def clear_image_cache() -> None:
    """Clear the image cache to free memory."""
    global _cache_size_bytes
    with _cache_lock:
        _image_cache.clear()
        _cache_size_bytes = 0


def crop_image(image: np.ndarray, x: int, y: int, 
               width: int, height: int) -> np.ndarray:
    """
    Crop a region from the image.
    
    Args:
        image: Input image
        x, y: Top-left corner coordinates
        width, height: Dimensions of crop region
    
    Returns:
        Cropped image
    """
    return image[y:y+height, x:x+width].copy()


def rotate_image(image: np.ndarray, angle: float) -> np.ndarray:
    """
    Rotate image by given angle.
    
    Args:
        image: Input image
        angle: Rotation angle in degrees (counter-clockwise)
    
    Returns:
        Rotated image
    """
    height, width = image.shape[:2]
    center = (width // 2, height // 2)
    
    # Get rotation matrix
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    
    # Calculate new image size
    cos = np.abs(rotation_matrix[0, 0])
    sin = np.abs(rotation_matrix[0, 1])
    new_width = int(height * sin + width * cos)
    new_height = int(height * cos + width * sin)
    
    # Adjust rotation matrix
    rotation_matrix[0, 2] += (new_width - width) / 2
    rotation_matrix[1, 2] += (new_height - height) / 2
    
    return cv2.warpAffine(image, rotation_matrix, (new_width, new_height))


def flip_image(image: np.ndarray, direction: str = 'horizontal') -> np.ndarray:
    """
    Flip image horizontally or vertically.
    
    Args:
        image: Input image
        direction: 'horizontal' or 'vertical'
    
    Returns:
        Flipped image
    """
    if direction == 'horizontal':
        return cv2.flip(image, 1)
    elif direction == 'vertical':
        return cv2.flip(image, 0)
    else:
        return cv2.flip(image, -1)  # Both


def convert_color_space(image: np.ndarray, target: str) -> np.ndarray:
    """
    Convert image to different color space.
    
    Args:
        image: Input image (BGR)
        target: Target color space ('rgb', 'gray', 'hsv', 'lab', 'ycrcb')
    
    Returns:
        Converted image
    """
    conversions = {
        'rgb': cv2.COLOR_BGR2RGB,
        'gray': cv2.COLOR_BGR2GRAY,
        'hsv': cv2.COLOR_BGR2HSV,
        'lab': cv2.COLOR_BGR2LAB,
        'ycrcb': cv2.COLOR_BGR2YCrCb
    }
    
    if target.lower() in conversions:
        return cv2.cvtColor(image, conversions[target.lower()])
    
    return image

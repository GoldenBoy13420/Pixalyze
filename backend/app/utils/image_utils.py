"""
Image utility functions.
"""
import cv2
import numpy as np
import base64
import io
from typing import Optional, Dict, Any, Tuple
from PIL import Image


def load_image(filepath: str) -> Optional[np.ndarray]:
    """
    Load an image from file.
    
    Args:
        filepath: Path to the image file
    
    Returns:
        Image as numpy array (BGR format) or None if failed
    """
    try:
        image = cv2.imread(filepath)
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


def image_to_base64(image: np.ndarray, format: str = 'png') -> str:
    """
    Convert numpy image to base64 string.
    
    Args:
        image: Image as numpy array
        format: Output format ('png', 'jpeg')
    
    Returns:
        Base64 encoded string with data URL prefix
    """
    # Ensure proper format
    if len(image.shape) == 2:
        # Grayscale
        pil_image = Image.fromarray(image, mode='L')
    else:
        # Color - convert from BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)
    
    # Encode to base64
    buffer = io.BytesIO()
    pil_image.save(buffer, format=format.upper())
    buffer.seek(0)
    
    base64_data = base64.b64encode(buffer.read()).decode('utf-8')
    mime_type = 'image/png' if format.lower() == 'png' else 'image/jpeg'
    
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


def resize_image(image: np.ndarray, max_dimension: int = 1024) -> np.ndarray:
    """
    Resize image if it exceeds maximum dimension while maintaining aspect ratio.
    
    Args:
        image: Input image
        max_dimension: Maximum width or height
    
    Returns:
        Resized image (or original if within limits)
    """
    height, width = image.shape[:2]
    
    if max(height, width) <= max_dimension:
        return image
    
    if width > height:
        new_width = max_dimension
        new_height = int(height * max_dimension / width)
    else:
        new_height = max_dimension
        new_width = int(width * max_dimension / height)
    
    return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)


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

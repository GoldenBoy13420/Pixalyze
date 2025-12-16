"""
Data converters and format utilities.
"""
import numpy as np
import cv2
import base64
import io
from typing import Dict, Any, List, Optional
from PIL import Image


def numpy_to_list(arr: np.ndarray) -> List:
    """
    Convert numpy array to Python list for JSON serialization.
    
    Args:
        arr: Numpy array
    
    Returns:
        Python list
    """
    return arr.tolist()


def list_to_numpy(data: List, dtype: type = np.float32) -> np.ndarray:
    """
    Convert Python list to numpy array.
    
    Args:
        data: Python list
        dtype: Numpy data type
    
    Returns:
        Numpy array
    """
    return np.array(data, dtype=dtype)


def image_to_bytes(image: np.ndarray, format: str = 'PNG') -> bytes:
    """
    Convert numpy image to bytes.
    
    Args:
        image: Image as numpy array
        format: Output format (PNG, JPEG, etc.)
    
    Returns:
        Image as bytes
    """
    # Handle grayscale images
    if len(image.shape) == 2:
        pil_image = Image.fromarray(image, mode='L')
    else:
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)
    
    buffer = io.BytesIO()
    pil_image.save(buffer, format=format)
    return buffer.getvalue()


def bytes_to_image(data: bytes) -> Optional[np.ndarray]:
    """
    Convert bytes to numpy image.
    
    Args:
        data: Image bytes
    
    Returns:
        Image as numpy array
    """
    try:
        nparr = np.frombuffer(data, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception:
        return None


def histogram_to_dict(histogram: np.ndarray, 
                      channel_name: str = 'intensity') -> Dict[str, Any]:
    """
    Convert histogram array to dictionary format.
    
    Args:
        histogram: Histogram as numpy array
        channel_name: Name of the channel
    
    Returns:
        Dictionary with histogram data
    """
    return {
        'channel': channel_name,
        'values': histogram.flatten().tolist(),
        'bins': list(range(256)),
        'min': int(np.argmax(histogram > 0)),
        'max': int(255 - np.argmax(histogram[::-1] > 0)),
        'peak': int(np.argmax(histogram)),
        'mean': float(np.average(range(256), weights=histogram.flatten()))
    }


def statistics_to_dict(image: np.ndarray) -> Dict[str, Any]:
    """
    Calculate image statistics and return as dictionary.
    
    Args:
        image: Image as numpy array
    
    Returns:
        Dictionary with statistics
    """
    stats = {
        'shape': image.shape,
        'dtype': str(image.dtype),
        'size_bytes': image.nbytes
    }
    
    if len(image.shape) == 2:
        # Grayscale
        stats['channels'] = {
            'gray': {
                'min': int(np.min(image)),
                'max': int(np.max(image)),
                'mean': float(np.mean(image)),
                'std': float(np.std(image)),
                'median': float(np.median(image))
            }
        }
    else:
        # Color (BGR)
        channel_names = ['blue', 'green', 'red']
        stats['channels'] = {}
        
        for i, name in enumerate(channel_names):
            channel = image[:, :, i]
            stats['channels'][name] = {
                'min': int(np.min(channel)),
                'max': int(np.max(channel)),
                'mean': float(np.mean(channel)),
                'std': float(np.std(channel)),
                'median': float(np.median(channel))
            }
    
    return stats


def color_space_convert(image: np.ndarray, 
                       source: str, target: str) -> np.ndarray:
    """
    Convert image between color spaces.
    
    Args:
        image: Input image
        source: Source color space (bgr, rgb, gray, hsv, lab)
        target: Target color space
    
    Returns:
        Converted image
    """
    # Conversion map
    conversions = {
        ('bgr', 'rgb'): cv2.COLOR_BGR2RGB,
        ('rgb', 'bgr'): cv2.COLOR_RGB2BGR,
        ('bgr', 'gray'): cv2.COLOR_BGR2GRAY,
        ('rgb', 'gray'): cv2.COLOR_RGB2GRAY,
        ('bgr', 'hsv'): cv2.COLOR_BGR2HSV,
        ('hsv', 'bgr'): cv2.COLOR_HSV2BGR,
        ('bgr', 'lab'): cv2.COLOR_BGR2LAB,
        ('lab', 'bgr'): cv2.COLOR_LAB2BGR,
        ('rgb', 'hsv'): cv2.COLOR_RGB2HSV,
        ('hsv', 'rgb'): cv2.COLOR_HSV2RGB,
    }
    
    key = (source.lower(), target.lower())
    
    if key in conversions:
        return cv2.cvtColor(image, conversions[key])
    
    # If direct conversion not found, try via BGR
    if source.lower() != 'bgr' and target.lower() != 'bgr':
        # Convert to BGR first
        to_bgr = (source.lower(), 'bgr')
        from_bgr = ('bgr', target.lower())
        
        if to_bgr in conversions and from_bgr in conversions:
            intermediate = cv2.cvtColor(image, conversions[to_bgr])
            return cv2.cvtColor(intermediate, conversions[from_bgr])
    
    return image


def normalize_image(image: np.ndarray, 
                   min_val: float = 0, max_val: float = 255) -> np.ndarray:
    """
    Normalize image to specified range.
    
    Args:
        image: Input image
        min_val: Minimum output value
        max_val: Maximum output value
    
    Returns:
        Normalized image
    """
    img_min = np.min(image)
    img_max = np.max(image)
    
    if img_max - img_min == 0:
        return np.full_like(image, min_val)
    
    normalized = (image - img_min) / (img_max - img_min) * (max_val - min_val) + min_val
    return normalized.astype(image.dtype)


def clip_image(image: np.ndarray) -> np.ndarray:
    """
    Clip image values to valid range [0, 255].
    
    Args:
        image: Input image
    
    Returns:
        Clipped image as uint8
    """
    return np.clip(image, 0, 255).astype(np.uint8)


def encode_json_safe(data: Any) -> Any:
    """
    Make data JSON serializable.
    
    Args:
        data: Input data (may contain numpy types)
    
    Returns:
        JSON-safe data
    """
    if isinstance(data, np.ndarray):
        return data.tolist()
    elif isinstance(data, np.integer):
        return int(data)
    elif isinstance(data, np.floating):
        return float(data)
    elif isinstance(data, dict):
        return {k: encode_json_safe(v) for k, v in data.items()}
    elif isinstance(data, (list, tuple)):
        return [encode_json_safe(item) for item in data]
    else:
        return data

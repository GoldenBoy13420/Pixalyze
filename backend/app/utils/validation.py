"""
Input validation utilities.
"""
import io
from typing import Tuple
from PIL import Image
from werkzeug.datastructures import FileStorage


def validate_image_file(file: FileStorage) -> Tuple[bool, str]:
    """
    Validate an uploaded image file.
    
    Args:
        file: Uploaded file from request
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if file is None:
        return False, "No file provided"
    
    if file.filename == '':
        return False, "No file selected"
    
    # Check file content is actually an image
    try:
        # Read file content
        file_content = file.read()
        file.seek(0)  # Reset for later use
        
        # Try to open as image
        img = Image.open(io.BytesIO(file_content))
        img.verify()
        
        # Check dimensions
        img = Image.open(io.BytesIO(file_content))
        width, height = img.size
        
        max_dimension = 4096
        if width > max_dimension or height > max_dimension:
            return False, f"Image dimensions too large. Maximum allowed: {max_dimension}x{max_dimension}"
        
        # Check file size (should be done by Flask config, but double-check)
        file_size = len(file_content)
        max_size = 16 * 1024 * 1024  # 16MB
        if file_size > max_size:
            return False, f"File size too large. Maximum allowed: {max_size // (1024*1024)}MB"
        
        return True, ""
        
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"


def validate_filter_params(filter_type: str, params: dict) -> Tuple[bool, str]:
    """
    Validate filter parameters.
    
    Args:
        filter_type: Type of filter
        params: Filter parameters
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Kernel size must be odd and positive
    if 'kernel_size' in params:
        ks = params['kernel_size']
        if not isinstance(ks, int) or ks < 1:
            return False, "kernel_size must be a positive integer"
        if ks % 2 == 0:
            return False, "kernel_size must be odd"
        if ks > 31:
            return False, "kernel_size must be 31 or less"
    
    # Sigma must be positive
    if 'sigma' in params:
        sigma = params['sigma']
        if not isinstance(sigma, (int, float)) or sigma <= 0:
            return False, "sigma must be a positive number"
    
    # Thresholds must be non-negative
    for threshold_key in ['threshold1', 'threshold2', 'threshold']:
        if threshold_key in params:
            val = params[threshold_key]
            if not isinstance(val, (int, float)) or val < 0:
                return False, f"{threshold_key} must be a non-negative number"
    
    # Strength must be positive
    if 'strength' in params:
        strength = params['strength']
        if not isinstance(strength, (int, float)) or strength <= 0:
            return False, "strength must be a positive number"
    
    return True, ""


def validate_noise_params(noise_type: str, params: dict) -> Tuple[bool, str]:
    """
    Validate noise parameters.
    
    Args:
        noise_type: Type of noise
        params: Noise parameters
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Standard deviation must be positive
    if 'std' in params:
        std = params['std']
        if not isinstance(std, (int, float)) or std <= 0:
            return False, "std must be a positive number"
    
    # Amount must be between 0 and 1
    if 'amount' in params:
        amount = params['amount']
        if not isinstance(amount, (int, float)) or amount < 0 or amount > 1:
            return False, "amount must be between 0 and 1"
    
    # Salt ratio must be between 0 and 1
    if 'salt_ratio' in params:
        ratio = params['salt_ratio']
        if not isinstance(ratio, (int, float)) or ratio < 0 or ratio > 1:
            return False, "salt_ratio must be between 0 and 1"
    
    return True, ""


def validate_frequency_params(params: dict) -> Tuple[bool, str]:
    """
    Validate frequency domain filter parameters.
    
    Args:
        params: Filter parameters
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Cutoff must be between 0 and 1
    if 'cutoff' in params:
        cutoff = params['cutoff']
        if not isinstance(cutoff, (int, float)) or cutoff < 0 or cutoff > 1:
            return False, "cutoff must be between 0 and 1"
    
    # High cutoff must be greater than low cutoff
    if 'cutoff_high' in params and 'cutoff' in params:
        if params['cutoff_high'] <= params['cutoff']:
            return False, "cutoff_high must be greater than cutoff"
    
    # Filter order must be positive integer
    if 'filter_order' in params:
        order = params['filter_order']
        if not isinstance(order, int) or order < 1:
            return False, "filter_order must be a positive integer"
    
    return True, ""


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent directory traversal attacks.
    
    Args:
        filename: Original filename
    
    Returns:
        Sanitized filename
    """
    # Remove path separators
    filename = filename.replace('/', '').replace('\\', '')
    
    # Remove null bytes
    filename = filename.replace('\x00', '')
    
    # Remove leading/trailing dots and spaces
    filename = filename.strip('. ')
    
    # Ensure filename is not empty
    if not filename:
        filename = 'unnamed'
    
    return filename

"""
Image filtering routes with performance optimizations.
"""
from flask import Blueprint, request, jsonify
import numpy as np
import hashlib
from functools import lru_cache
import threading

from app.routes.image_routes import get_image_store
from app.models.ImageProcessor import ImageProcessor
from app.utils.image_utils import load_image, image_to_base64, resize_for_processing

filter_bp = Blueprint('filters', __name__)

# Result cache for filter operations
_filter_cache = {}
_filter_cache_lock = threading.Lock()
_MAX_FILTER_CACHE = 100


def _get_filter_cache_key(image_id: str, filter_type: str, params: dict) -> str:
    """Generate cache key for filter result."""
    param_str = str(sorted(params.items()))
    return hashlib.md5(f"{image_id}_{filter_type}_{param_str}".encode()).hexdigest()


def _get_cached_result(cache_key: str) -> str:
    """Get cached filter result if available."""
    with _filter_cache_lock:
        return _filter_cache.get(cache_key)


def _cache_result(cache_key: str, result: str) -> None:
    """Cache filter result."""
    with _filter_cache_lock:
        if len(_filter_cache) >= _MAX_FILTER_CACHE:
            # Remove oldest entry
            oldest_key = next(iter(_filter_cache))
            del _filter_cache[oldest_key]
        _filter_cache[cache_key] = result

# Available filters with their parameters
AVAILABLE_FILTERS = {
    'blur': {
        'name': 'Gaussian Blur',
        'params': ['kernel_size', 'sigma'],
        'defaults': {'kernel_size': 5, 'sigma': 1.0}
    },
    'box_blur': {
        'name': 'Box Blur (Average)',
        'params': ['kernel_size'],
        'defaults': {'kernel_size': 5}
    },
    'median': {
        'name': 'Median Filter',
        'params': ['kernel_size'],
        'defaults': {'kernel_size': 5}
    },
    'bilateral': {
        'name': 'Bilateral Filter',
        'params': ['d', 'sigma_color', 'sigma_space'],
        'defaults': {'d': 9, 'sigma_color': 75, 'sigma_space': 75}
    },
    'sharpen': {
        'name': 'Sharpen',
        'params': ['strength'],
        'defaults': {'strength': 1.0}
    },
    'unsharp_mask': {
        'name': 'Unsharp Mask',
        'params': ['sigma', 'strength', 'threshold'],
        'defaults': {'sigma': 1.0, 'strength': 1.5, 'threshold': 0}
    },
    'edge_sobel': {
        'name': 'Sobel Edge Detection',
        'params': ['ksize'],
        'defaults': {'ksize': 3}
    },
    'edge_laplacian': {
        'name': 'Laplacian Edge Detection',
        'params': ['ksize'],
        'defaults': {'ksize': 3}
    },
    'edge_canny': {
        'name': 'Canny Edge Detection',
        'params': ['threshold1', 'threshold2'],
        'defaults': {'threshold1': 100, 'threshold2': 200}
    },
    'emboss': {
        'name': 'Emboss',
        'params': [],
        'defaults': {}
    },
    'high_pass': {
        'name': 'High Pass Filter',
        'params': ['kernel_size'],
        'defaults': {'kernel_size': 3}
    },
    'low_pass': {
        'name': 'Low Pass Filter',
        'params': ['kernel_size'],
        'defaults': {'kernel_size': 5}
    },
    'custom': {
        'name': 'Custom Kernel',
        'params': ['kernel'],
        'defaults': {'kernel': [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]}
    }
}


@filter_bp.route('/available', methods=['GET'])
def get_available_filters():
    """
    Get list of available filters and their parameters.
    
    Returns:
        JSON with available filters information
    """
    return jsonify({
        'success': True,
        'filters': AVAILABLE_FILTERS
    })


@filter_bp.route('/apply', methods=['POST'])
def apply_filter():
    """
    Apply a filter to an image with caching support.
    
    Request JSON:
        - image_id: Image identifier
        - filter_type: Type of filter to apply
        - params: Filter-specific parameters (optional)
        - use_cache: Whether to use cached results (default True)
    
    Returns:
        Base64 encoded filtered image
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    if 'filter_type' not in data:
        return jsonify({'error': 'filter_type is required'}), 400
    
    image_id = data['image_id']
    filter_type = data['filter_type']
    params = data.get('params', {})
    use_cache = data.get('use_cache', True)
    
    if filter_type not in AVAILABLE_FILTERS:
        return jsonify({'error': f'Unknown filter type: {filter_type}'}), 400
    
    # Check cache first
    cache_key = _get_filter_cache_key(image_id, filter_type, params)
    if use_cache:
        cached = _get_cached_result(cache_key)
        if cached:
            return jsonify({
                'success': True,
                'image_id': image_id,
                'filter_type': filter_type,
                'params': params,
                'result_image': cached,
                'cached': True
            })
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    
    # Apply appropriate filter with parameters
    try:
        result = apply_filter_to_image(processor, filter_type, params)
    except Exception as e:
        return jsonify({'error': f'Filter application failed: {str(e)}'}), 500
    
    result_base64 = image_to_base64(result)
    
    # Cache the result
    if use_cache:
        _cache_result(cache_key, result_base64)
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'filter_type': filter_type,
        'params': params,
        'result_image': result_base64,
        'cached': False
    })


def apply_filter_to_image(processor, filter_type, params):
    """
    Apply the specified filter to the image processor.
    
    Args:
        processor: ImageProcessor instance
        filter_type: Type of filter
        params: Filter parameters
    
    Returns:
        Filtered image as numpy array
    """
    defaults = AVAILABLE_FILTERS[filter_type]['defaults']
    
    # Merge provided params with defaults
    merged_params = {**defaults, **params}
    
    if filter_type == 'blur':
        return processor.gaussian_blur(
            merged_params['kernel_size'],
            merged_params['sigma']
        )
    elif filter_type == 'box_blur':
        return processor.box_blur(merged_params['kernel_size'])
    elif filter_type == 'median':
        return processor.median_filter(merged_params['kernel_size'])
    elif filter_type == 'bilateral':
        return processor.bilateral_filter(
            merged_params['d'],
            merged_params['sigma_color'],
            merged_params['sigma_space']
        )
    elif filter_type == 'sharpen':
        return processor.sharpen(merged_params['strength'])
    elif filter_type == 'unsharp_mask':
        return processor.unsharp_mask(
            merged_params['sigma'],
            merged_params['strength'],
            merged_params['threshold']
        )
    elif filter_type == 'edge_sobel':
        return processor.sobel_edge_detection(merged_params['ksize'])
    elif filter_type == 'edge_laplacian':
        return processor.laplacian_edge_detection(merged_params['ksize'])
    elif filter_type == 'edge_canny':
        return processor.canny_edge_detection(
            merged_params['threshold1'],
            merged_params['threshold2']
        )
    elif filter_type == 'emboss':
        return processor.emboss()
    elif filter_type == 'high_pass':
        return processor.high_pass_filter(merged_params['kernel_size'])
    elif filter_type == 'low_pass':
        return processor.low_pass_filter(merged_params['kernel_size'])
    elif filter_type == 'custom':
        kernel = np.array(merged_params['kernel'], dtype=np.float32)
        return processor.apply_custom_kernel(kernel)
    else:
        raise ValueError(f'Unsupported filter type: {filter_type}')


@filter_bp.route('/preview', methods=['POST'])
def preview_filter():
    """
    Preview filter effect on a small portion of the image.
    
    Request JSON:
        - image_id: Image identifier
        - filter_type: Type of filter
        - params: Filter parameters
        - region: Optional region to preview (x, y, width, height)
    
    Returns:
        Base64 encoded preview image
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    image_id = data['image_id']
    filter_type = data.get('filter_type', 'blur')
    params = data.get('params', {})
    region = data.get('region')
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    # Extract region if specified
    if region:
        x, y, w, h = region['x'], region['y'], region['width'], region['height']
        image = image[y:y+h, x:x+w]
    
    processor = ImageProcessor(image)
    
    try:
        result = apply_filter_to_image(processor, filter_type, params)
    except Exception as e:
        return jsonify({'error': f'Preview failed: {str(e)}'}), 500
    
    result_base64 = image_to_base64(result)
    
    return jsonify({
        'success': True,
        'preview_image': result_base64
    })

"""
Noise addition and removal routes.
"""
from flask import Blueprint, request, jsonify
import numpy as np

from app.routes.image_routes import get_image_store
from app.models.ImageProcessor import ImageProcessor
from app.utils.image_utils import load_image, image_to_base64

noise_bp = Blueprint('noise', __name__)

# Available noise types
NOISE_TYPES = {
    'gaussian': {
        'name': 'Gaussian Noise',
        'params': ['mean', 'std'],
        'defaults': {'mean': 0, 'std': 25}
    },
    'salt_pepper': {
        'name': 'Salt and Pepper Noise',
        'params': ['amount', 'salt_ratio'],
        'defaults': {'amount': 0.05, 'salt_ratio': 0.5}
    },
    'poisson': {
        'name': 'Poisson Noise',
        'params': ['scale'],
        'defaults': {'scale': 1.0}
    },
    'speckle': {
        'name': 'Speckle Noise',
        'params': ['std'],
        'defaults': {'std': 0.1}
    },
    'uniform': {
        'name': 'Uniform Noise',
        'params': ['low', 'high'],
        'defaults': {'low': -50, 'high': 50}
    }
}

# Available denoising methods
DENOISE_METHODS = {
    'gaussian': {
        'name': 'Gaussian Blur',
        'params': ['kernel_size', 'sigma'],
        'defaults': {'kernel_size': 5, 'sigma': 1.0}
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
    'nlm': {
        'name': 'Non-Local Means',
        'params': ['h', 'template_window_size', 'search_window_size'],
        'defaults': {'h': 10, 'template_window_size': 7, 'search_window_size': 21}
    },
    'morphological': {
        'name': 'Morphological Opening/Closing',
        'params': ['kernel_size', 'operation'],
        'defaults': {'kernel_size': 5, 'operation': 'opening'}
    },
    'wiener': {
        'name': 'Wiener Filter',
        'params': ['noise_variance'],
        'defaults': {'noise_variance': None}
    }
}


@noise_bp.route('/types', methods=['GET'])
def get_noise_types():
    """
    Get available noise types and their parameters.
    
    Returns:
        JSON with noise types information
    """
    return jsonify({
        'success': True,
        'noise_types': NOISE_TYPES
    })


@noise_bp.route('/denoise-methods', methods=['GET'])
def get_denoise_methods():
    """
    Get available denoising methods and their parameters.
    
    Returns:
        JSON with denoising methods information
    """
    return jsonify({
        'success': True,
        'denoise_methods': DENOISE_METHODS
    })


@noise_bp.route('/add', methods=['POST'])
def add_noise():
    """
    Add noise to an image.
    
    Request JSON:
        - image_id: Image identifier
        - noise_type: Type of noise to add
        - params: Noise-specific parameters (optional)
    
    Returns:
        Base64 encoded noisy image
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    if 'noise_type' not in data:
        return jsonify({'error': 'noise_type is required'}), 400
    
    image_id = data['image_id']
    noise_type = data['noise_type']
    params = data.get('params', {})
    
    if noise_type not in NOISE_TYPES:
        return jsonify({'error': f'Unknown noise type: {noise_type}'}), 400
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    
    # Merge provided params with defaults
    defaults = NOISE_TYPES[noise_type]['defaults']
    merged_params = {**defaults, **params}
    
    try:
        result = add_noise_to_image(processor, noise_type, merged_params)
    except Exception as e:
        return jsonify({'error': f'Noise addition failed: {str(e)}'}), 500
    
    result_base64 = image_to_base64(result)
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'noise_type': noise_type,
        'params': merged_params,
        'result_image': result_base64
    })


def add_noise_to_image(processor, noise_type, params):
    """
    Add the specified noise to the image.
    
    Args:
        processor: ImageProcessor instance
        noise_type: Type of noise
        params: Noise parameters
    
    Returns:
        Noisy image as numpy array
    """
    if noise_type == 'gaussian':
        return processor.add_gaussian_noise(params['mean'], params['std'])
    elif noise_type == 'salt_pepper':
        return processor.add_salt_pepper_noise(params['amount'], params['salt_ratio'])
    elif noise_type == 'poisson':
        return processor.add_poisson_noise(params['scale'])
    elif noise_type == 'speckle':
        return processor.add_speckle_noise(params['std'])
    elif noise_type == 'uniform':
        return processor.add_uniform_noise(params['low'], params['high'])
    else:
        raise ValueError(f'Unsupported noise type: {noise_type}')


@noise_bp.route('/remove', methods=['POST'])
def remove_noise():
    """
    Remove noise from an image.
    
    Request JSON:
        - image_id: Image identifier
        - method: Denoising method to use
        - params: Method-specific parameters (optional)
    
    Returns:
        Base64 encoded denoised image
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    image_id = data['image_id']
    method = data.get('method', 'median')
    params = data.get('params', {})
    
    if method not in DENOISE_METHODS:
        return jsonify({'error': f'Unknown denoising method: {method}'}), 400
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    
    # Merge provided params with defaults
    defaults = DENOISE_METHODS[method]['defaults']
    merged_params = {**defaults, **params}
    
    try:
        result = denoise_image(processor, method, merged_params)
    except Exception as e:
        return jsonify({'error': f'Denoising failed: {str(e)}'}), 500
    
    result_base64 = image_to_base64(result)
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'method': method,
        'params': merged_params,
        'result_image': result_base64
    })


def denoise_image(processor, method, params):
    """
    Apply the specified denoising method to the image.
    
    Args:
        processor: ImageProcessor instance
        method: Denoising method
        params: Method parameters
    
    Returns:
        Denoised image as numpy array
    """
    if method == 'gaussian':
        return processor.gaussian_blur(params['kernel_size'], params['sigma'])
    elif method == 'median':
        return processor.median_filter(params['kernel_size'])
    elif method == 'bilateral':
        return processor.bilateral_filter(
            params['d'],
            params['sigma_color'],
            params['sigma_space']
        )
    elif method == 'nlm':
        return processor.non_local_means_denoise(
            params['h'],
            params['template_window_size'],
            params['search_window_size']
        )
    elif method == 'morphological':
        return processor.morphological_denoise(
            params['kernel_size'],
            params['operation']
        )
    elif method == 'wiener':
        return processor.wiener_filter(params['noise_variance'])
    else:
        raise ValueError(f'Unsupported denoising method: {method}')


@noise_bp.route('/estimate', methods=['POST'])
def estimate_noise():
    """
    Estimate noise level in an image.
    
    Request JSON:
        - image_id: Image identifier
        - method: Estimation method ('mad', 'laplacian', 'wavelet')
    
    Returns:
        Estimated noise level
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    image_id = data['image_id']
    method = data.get('method', 'mad')
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    
    try:
        noise_level = processor.estimate_noise(method)
    except Exception as e:
        return jsonify({'error': f'Noise estimation failed: {str(e)}'}), 500
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'method': method,
        'noise_level': float(noise_level)
    })


@noise_bp.route('/compare', methods=['POST'])
def compare_denoising():
    """
    Compare multiple denoising methods on an image.
    
    Request JSON:
        - image_id: Image identifier
        - methods: List of methods to compare (optional, defaults to all)
    
    Returns:
        Base64 encoded results for each method with quality metrics
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    image_id = data['image_id']
    methods = data.get('methods', list(DENOISE_METHODS.keys()))
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    results = {}
    
    for method in methods:
        if method not in DENOISE_METHODS:
            continue
        
        try:
            processor = ImageProcessor(image.copy())
            defaults = DENOISE_METHODS[method]['defaults']
            result = denoise_image(processor, method, defaults)
            
            results[method] = {
                'name': DENOISE_METHODS[method]['name'],
                'result_image': image_to_base64(result)
            }
        except Exception as e:
            results[method] = {
                'name': DENOISE_METHODS[method]['name'],
                'error': str(e)
            }
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'results': results
    })

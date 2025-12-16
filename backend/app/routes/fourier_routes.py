"""
Fourier transform and frequency domain filtering routes.
"""
from flask import Blueprint, request, jsonify
import numpy as np

from app.routes.image_routes import get_image_store
from app.models.ImageProcessor import ImageProcessor
from app.utils.image_utils import load_image, image_to_base64

fourier_bp = Blueprint('fourier', __name__)


@fourier_bp.route('/transform', methods=['POST'])
def compute_fft():
    """
    Compute the Fourier Transform of an image.
    
    Request JSON:
        - image_id: Image identifier
        - shift: Whether to shift zero frequency to center (default: True)
        - log_scale: Whether to apply log scaling for visualization (default: True)
    
    Returns:
        Base64 encoded magnitude spectrum image
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    image_id = data['image_id']
    shift = data.get('shift', True)
    log_scale = data.get('log_scale', True)
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    magnitude_spectrum, phase_spectrum = processor.compute_fft(shift=shift)
    
    # Create visualization
    if log_scale:
        magnitude_vis = processor.visualize_fft_magnitude(magnitude_spectrum)
    else:
        magnitude_vis = (magnitude_spectrum / magnitude_spectrum.max() * 255).astype(np.uint8)
    
    phase_vis = processor.visualize_fft_phase(phase_spectrum)
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'magnitude_spectrum': image_to_base64(magnitude_vis),
        'phase_spectrum': image_to_base64(phase_vis)
    })


@fourier_bp.route('/inverse', methods=['POST'])
def compute_inverse_fft():
    """
    Compute inverse FFT from magnitude and phase data.
    
    Request JSON:
        - image_id: Image identifier (to get original dimensions)
    
    Returns:
        Base64 encoded reconstructed image
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    image_id = data['image_id']
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    
    # Compute FFT and then inverse to demonstrate reconstruction
    magnitude, phase = processor.compute_fft(shift=True)
    reconstructed = processor.compute_inverse_fft(magnitude, phase, shift=True)
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'reconstructed_image': image_to_base64(reconstructed)
    })


@fourier_bp.route('/filter', methods=['POST'])
def apply_frequency_filter():
    """
    Apply frequency domain filtering.
    
    Request JSON:
        - image_id: Image identifier
        - filter_type: 'lowpass', 'highpass', 'bandpass', 'bandstop', 'notch'
        - cutoff: Cutoff frequency (0-1, normalized)
        - cutoff_high: High cutoff for bandpass/bandstop
        - filter_order: Order for Butterworth filter (default: 2)
        - filter_method: 'ideal', 'gaussian', 'butterworth'
    
    Returns:
        Base64 encoded filtered image and filter mask
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    image_id = data['image_id']
    filter_type = data.get('filter_type', 'lowpass')
    cutoff = data.get('cutoff', 0.3)
    cutoff_high = data.get('cutoff_high', 0.7)
    filter_order = data.get('filter_order', 2)
    filter_method = data.get('filter_method', 'gaussian')
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    
    try:
        result, filter_mask = processor.apply_frequency_filter(
            filter_type=filter_type,
            cutoff=cutoff,
            cutoff_high=cutoff_high,
            order=filter_order,
            method=filter_method
        )
    except Exception as e:
        return jsonify({'error': f'Frequency filtering failed: {str(e)}'}), 500
    
    # Visualize filter mask
    filter_vis = (filter_mask * 255).astype(np.uint8)
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'filter_type': filter_type,
        'filter_method': filter_method,
        'result_image': image_to_base64(result),
        'filter_mask': image_to_base64(filter_vis)
    })


@fourier_bp.route('/homomorphic', methods=['POST'])
def homomorphic_filter():
    """
    Apply homomorphic filtering for illumination correction.
    
    Request JSON:
        - image_id: Image identifier
        - gamma_low: Low frequency gain (default: 0.3)
        - gamma_high: High frequency gain (default: 1.5)
        - cutoff: Cutoff frequency (default: 30)
        - c: Constant for filter sharpness (default: 1)
    
    Returns:
        Base64 encoded filtered image
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    image_id = data['image_id']
    gamma_low = data.get('gamma_low', 0.3)
    gamma_high = data.get('gamma_high', 1.5)
    cutoff = data.get('cutoff', 30)
    c = data.get('c', 1)
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    
    try:
        result = processor.homomorphic_filter(
            gamma_low=gamma_low,
            gamma_high=gamma_high,
            cutoff=cutoff,
            c=c
        )
    except Exception as e:
        return jsonify({'error': f'Homomorphic filtering failed: {str(e)}'}), 500
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'result_image': image_to_base64(result)
    })


@fourier_bp.route('/available', methods=['GET'])
def get_available_frequency_filters():
    """
    Get available frequency domain filters and their parameters.
    
    Returns:
        JSON with available filters information
    """
    filters = {
        'lowpass': {
            'name': 'Low Pass Filter',
            'description': 'Removes high frequency components (smoothing)',
            'params': ['cutoff', 'filter_method', 'filter_order']
        },
        'highpass': {
            'name': 'High Pass Filter',
            'description': 'Removes low frequency components (edge enhancement)',
            'params': ['cutoff', 'filter_method', 'filter_order']
        },
        'bandpass': {
            'name': 'Band Pass Filter',
            'description': 'Keeps frequencies within a band',
            'params': ['cutoff', 'cutoff_high', 'filter_method', 'filter_order']
        },
        'bandstop': {
            'name': 'Band Stop Filter',
            'description': 'Removes frequencies within a band',
            'params': ['cutoff', 'cutoff_high', 'filter_method', 'filter_order']
        },
        'homomorphic': {
            'name': 'Homomorphic Filter',
            'description': 'Illumination correction',
            'params': ['gamma_low', 'gamma_high', 'cutoff', 'c']
        }
    }
    
    methods = {
        'ideal': 'Sharp cutoff',
        'gaussian': 'Smooth Gaussian transition',
        'butterworth': 'Adjustable transition sharpness'
    }
    
    return jsonify({
        'success': True,
        'filters': filters,
        'methods': methods
    })

"""
Histogram analysis and equalization routes.
"""
import base64
import io
from flask import Blueprint, request, jsonify
import numpy as np
import cv2

from app.routes.image_routes import get_image_store
from app.models.ImageProcessor import ImageProcessor
from app.utils.image_utils import load_image, image_to_base64

histogram_bp = Blueprint('histogram', __name__)


@histogram_bp.route('/<image_id>', methods=['GET'])
def get_histogram(image_id):
    """
    Calculate histogram for an image.
    
    Args:
        image_id: Unique image identifier
    
    Returns:
        JSON with histogram data for each channel
    """
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    histogram_data = processor.calculate_histogram()
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'histogram': histogram_data
    })


@histogram_bp.route('/equalize', methods=['POST'])
def equalize_histogram():
    """
    Perform histogram equalization on an image.
    
    Request JSON:
        - image_id: Image identifier
        - method: Equalization method ('global', 'clahe', 'adaptive')
        - clip_limit: CLAHE clip limit (default: 2.0)
        - tile_size: CLAHE tile grid size (default: 8)
    
    Returns:
        Base64 encoded equalized image
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    image_id = data['image_id']
    method = data.get('method', 'global')
    clip_limit = data.get('clip_limit', 2.0)
    tile_size = data.get('tile_size', 8)
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    
    if method == 'clahe':
        result = processor.clahe_equalization(clip_limit, (tile_size, tile_size))
    elif method == 'adaptive':
        result = processor.adaptive_histogram_equalization()
    else:
        result = processor.histogram_equalization()
    
    # Get histogram of equalized image
    result_processor = ImageProcessor(result)
    equalized_histogram = result_processor.calculate_histogram()
    
    # Convert result to base64
    result_base64 = image_to_base64(result)
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'method': method,
        'result_image': result_base64,
        'equalized_histogram': equalized_histogram
    })


@histogram_bp.route('/stretch', methods=['POST'])
def contrast_stretch():
    """
    Perform contrast stretching on an image.
    
    Request JSON:
        - image_id: Image identifier
        - low_percentile: Lower percentile (default: 2)
        - high_percentile: Upper percentile (default: 98)
    
    Returns:
        Base64 encoded stretched image
    """
    data = request.get_json()
    
    if not data or 'image_id' not in data:
        return jsonify({'error': 'image_id is required'}), 400
    
    image_id = data['image_id']
    low_percentile = data.get('low_percentile', 2)
    high_percentile = data.get('high_percentile', 98)
    
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    result = processor.contrast_stretch(low_percentile, high_percentile)
    
    result_base64 = image_to_base64(result)
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'result_image': result_base64
    })


@histogram_bp.route('/statistics/<image_id>', methods=['GET'])
def get_image_statistics(image_id):
    """
    Get statistical information about an image.
    
    Args:
        image_id: Unique image identifier
    
    Returns:
        JSON with image statistics (mean, std, min, max, etc.)
    """
    image_store = get_image_store()
    
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    image = load_image(image_data['filepath'])
    
    if image is None:
        return jsonify({'error': 'Failed to load image'}), 500
    
    processor = ImageProcessor(image)
    statistics = processor.get_statistics()
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'statistics': statistics
    })

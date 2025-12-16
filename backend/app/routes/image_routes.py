"""
Image upload and management routes.
"""
import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.utils import secure_filename

from app.utils.validation import validate_image_file
from app.utils.image_utils import load_image, save_image, get_image_info

image_bp = Blueprint('images', __name__)

# In-memory storage for image metadata (use database in production)
image_store = {}


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


@image_bp.route('/upload', methods=['POST'])
def upload_image():
    """
    Upload an image file.
    
    Returns:
        JSON with image ID and metadata
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    # Validate image
    is_valid, error_msg = validate_image_file(file)
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    # Generate unique ID and save file
    image_id = str(uuid.uuid4())
    filename = secure_filename(file.filename)
    extension = filename.rsplit('.', 1)[1].lower()
    saved_filename = f"{image_id}.{extension}"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], saved_filename)
    
    file.seek(0)  # Reset file pointer after validation
    file.save(filepath)
    
    # Get image info
    image_info = get_image_info(filepath)
    
    # Store metadata
    image_store[image_id] = {
        'id': image_id,
        'original_filename': filename,
        'filepath': filepath,
        'extension': extension,
        **image_info
    }
    
    return jsonify({
        'success': True,
        'image_id': image_id,
        'filename': filename,
        **image_info
    }), 201


@image_bp.route('/<image_id>', methods=['GET'])
def get_image(image_id):
    """
    Get image by ID.
    
    Args:
        image_id: Unique image identifier
    
    Returns:
        Image file or error response
    """
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    
    # Check if requesting metadata or file
    if request.args.get('metadata') == 'true':
        return jsonify({
            'id': image_data['id'],
            'filename': image_data['original_filename'],
            'width': image_data.get('width'),
            'height': image_data.get('height'),
            'channels': image_data.get('channels'),
            'format': image_data.get('format')
        })
    
    return send_file(image_data['filepath'], mimetype=f"image/{image_data['extension']}")


@image_bp.route('/<image_id>', methods=['DELETE'])
def delete_image(image_id):
    """
    Delete image by ID.
    
    Args:
        image_id: Unique image identifier
    
    Returns:
        Success or error response
    """
    if image_id not in image_store:
        return jsonify({'error': 'Image not found'}), 404
    
    image_data = image_store[image_id]
    
    # Delete file
    try:
        os.remove(image_data['filepath'])
    except OSError:
        pass  # File might already be deleted
    
    # Remove from store
    del image_store[image_id]
    
    return jsonify({'success': True, 'message': 'Image deleted'}), 200


@image_bp.route('/list', methods=['GET'])
def list_images():
    """
    List all uploaded images.
    
    Returns:
        JSON array of image metadata
    """
    images = [
        {
            'id': data['id'],
            'filename': data['original_filename'],
            'width': data.get('width'),
            'height': data.get('height')
        }
        for data in image_store.values()
    ]
    
    return jsonify({'images': images, 'count': len(images)})


# Export image store for use by other routes
def get_image_store():
    """Get the image store dictionary."""
    return image_store

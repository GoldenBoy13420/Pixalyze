"""
Error handling middleware.
"""
from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException
import traceback


def register_error_handlers(app: Flask) -> None:
    """
    Register error handlers for the Flask application.
    
    Args:
        app: Flask application instance
    """
    
    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 Bad Request errors."""
        return jsonify({
            'error': 'Bad Request',
            'message': str(error.description) if hasattr(error, 'description') else 'Invalid request',
            'status_code': 400
        }), 400
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 Not Found errors."""
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found',
            'status_code': 404
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        """Handle 405 Method Not Allowed errors."""
        return jsonify({
            'error': 'Method Not Allowed',
            'message': 'The method is not allowed for the requested URL',
            'status_code': 405
        }), 405
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        """Handle 413 Request Entity Too Large errors."""
        return jsonify({
            'error': 'File Too Large',
            'message': 'The uploaded file exceeds the maximum allowed size',
            'status_code': 413
        }), 413
    
    @app.errorhandler(415)
    def unsupported_media_type(error):
        """Handle 415 Unsupported Media Type errors."""
        return jsonify({
            'error': 'Unsupported Media Type',
            'message': 'The file type is not supported',
            'status_code': 415
        }), 415
    
    @app.errorhandler(422)
    def unprocessable_entity(error):
        """Handle 422 Unprocessable Entity errors."""
        return jsonify({
            'error': 'Unprocessable Entity',
            'message': str(error.description) if hasattr(error, 'description') else 'Unable to process the request',
            'status_code': 422
        }), 422
    
    @app.errorhandler(429)
    def too_many_requests(error):
        """Handle 429 Too Many Requests errors."""
        return jsonify({
            'error': 'Too Many Requests',
            'message': 'Rate limit exceeded. Please try again later.',
            'status_code': 429
        }), 429
    
    @app.errorhandler(500)
    def internal_server_error(error):
        """Handle 500 Internal Server Error."""
        # Log the error
        app.logger.error(f'Internal Server Error: {error}')
        if app.debug:
            app.logger.error(traceback.format_exc())
        
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred. Please try again later.',
            'status_code': 500
        }), 500
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle all other HTTP exceptions."""
        return jsonify({
            'error': error.name,
            'message': error.description,
            'status_code': error.code
        }), error.code
    
    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """Handle all unhandled exceptions."""
        # Log the error
        app.logger.error(f'Unhandled Exception: {error}')
        app.logger.error(traceback.format_exc())
        
        if app.debug:
            # In debug mode, return more details
            return jsonify({
                'error': 'Internal Server Error',
                'message': str(error),
                'traceback': traceback.format_exc(),
                'status_code': 500
            }), 500
        else:
            return jsonify({
                'error': 'Internal Server Error',
                'message': 'An unexpected error occurred',
                'status_code': 500
            }), 500


class ImageProcessingError(Exception):
    """Custom exception for image processing errors."""
    
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ValidationError(Exception):
    """Custom exception for validation errors."""
    
    def __init__(self, message: str, field: str = None):
        super().__init__(message)
        self.message = message
        self.field = field
        self.status_code = 422


def register_custom_error_handlers(app: Flask) -> None:
    """
    Register custom error handlers.
    
    Args:
        app: Flask application instance
    """
    
    @app.errorhandler(ImageProcessingError)
    def handle_image_processing_error(error):
        """Handle image processing errors."""
        return jsonify({
            'error': 'Image Processing Error',
            'message': error.message,
            'status_code': error.status_code
        }), error.status_code
    
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        """Handle validation errors."""
        response = {
            'error': 'Validation Error',
            'message': error.message,
            'status_code': error.status_code
        }
        if error.field:
            response['field'] = error.field
        
        return jsonify(response), error.status_code

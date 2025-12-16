"""
Main Flask application entry point with performance optimizations.
"""
from flask import Flask, request, after_this_request
from flask_cors import CORS
import os
import gzip
from io import BytesIO
from functools import wraps

from config import get_config
from app.routes import register_routes
from app.middleware.error_handler import register_error_handlers
from app.middleware.cors_handler import configure_cors


def gzip_response(f):
    """Decorator to gzip responses larger than threshold."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        @after_this_request
        def compress(response):
            if (response.status_code < 200 or 
                response.status_code >= 300 or
                'Content-Encoding' in response.headers or
                len(response.get_data()) < 1024):  # Don't compress small responses
                return response
            
            accept_encoding = request.headers.get('Accept-Encoding', '')
            if 'gzip' not in accept_encoding.lower():
                return response
            
            compressed = gzip.compress(response.get_data(), compresslevel=6)
            response.set_data(compressed)
            response.headers['Content-Encoding'] = 'gzip'
            response.headers['Content-Length'] = len(compressed)
            return response
        return f(*args, **kwargs)
    return decorated_function


def create_app(config_class=None):
    """
    Application factory function with performance optimizations.
    
    Args:
        config_class: Configuration class to use. Defaults to environment-based config.
    
    Returns:
        Flask application instance.
    """
    app = Flask(__name__)
    
    # Load configuration
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)
    
    # Performance optimizations
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000  # 1 year cache for static files
    app.config['JSON_SORT_KEYS'] = False  # Faster JSON serialization
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Configure CORS
    configure_cors(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register routes
    register_routes(app)
    
    # Add gzip compression for large responses
    @app.after_request
    def compress_response(response):
        """Compress large JSON responses with gzip."""
        if (response.status_code < 200 or 
            response.status_code >= 300 or
            'Content-Encoding' in response.headers or
            not response.content_type or
            'application/json' not in response.content_type):
            return response
        
        data = response.get_data()
        if len(data) < 1024:  # Don't compress small responses
            return response
        
        accept_encoding = request.headers.get('Accept-Encoding', '')
        if 'gzip' not in accept_encoding.lower():
            return response
        
        compressed = gzip.compress(data, compresslevel=6)
        response.set_data(compressed)
        response.headers['Content-Encoding'] = 'gzip'
        response.headers['Content-Length'] = len(compressed)
        response.headers['Vary'] = 'Accept-Encoding'
        return response
    
    # Add cache headers for static resources
    @app.after_request
    def add_cache_headers(response):
        """Add caching headers to responses."""
        # Cache filter list and static data
        if request.path.endswith('/available') or request.path.endswith('/types'):
            response.headers['Cache-Control'] = 'public, max-age=3600'  # 1 hour
        return response
    
    return app


# Create the application instance
app = create_app()


if __name__ == '__main__':
    # Use threaded mode for better concurrent request handling
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)

"""
Routes package initialization.
Registers all route blueprints with the Flask application.
"""
from flask import Blueprint

from .image_routes import image_bp
from .histogram_routes import histogram_bp
from .filter_routes import filter_bp
from .fourier_routes import fourier_bp
from .noise_routes import noise_bp


def register_routes(app):
    """
    Register all route blueprints with the application.
    
    Args:
        app: Flask application instance
    """
    # API prefix for all routes
    api_prefix = '/api'
    
    app.register_blueprint(image_bp, url_prefix=f'{api_prefix}/images')
    app.register_blueprint(histogram_bp, url_prefix=f'{api_prefix}/histogram')
    app.register_blueprint(filter_bp, url_prefix=f'{api_prefix}/filters')
    app.register_blueprint(fourier_bp, url_prefix=f'{api_prefix}/fourier')
    app.register_blueprint(noise_bp, url_prefix=f'{api_prefix}/noise')
    
    # Health check endpoints
    @app.route('/health')
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Image Processing API is running'}
    
    # API info endpoint
    @app.route('/api')
    def api_info():
        return {
            'name': 'ImageFX Studio API',
            'version': '1.0.0',
            'endpoints': {
                'images': '/api/images',
                'histogram': '/api/histogram',
                'filters': '/api/filters',
                'fourier': '/api/fourier',
                'noise': '/api/noise'
            }
        }

"""
Main Flask application entry point.
"""
from flask import Flask
from flask_cors import CORS
import os

from config import get_config
from app.routes import register_routes
from app.middleware.error_handler import register_error_handlers
from app.middleware.cors_handler import configure_cors


def create_app(config_class=None):
    """
    Application factory function.
    
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
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Configure CORS
    configure_cors(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register routes
    register_routes(app)
    
    return app


# Create the application instance
app = create_app()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

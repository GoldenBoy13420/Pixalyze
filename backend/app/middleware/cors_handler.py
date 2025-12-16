"""
CORS (Cross-Origin Resource Sharing) handler.
"""
from flask import Flask
from flask_cors import CORS


def configure_cors(app: Flask) -> None:
    """
    Configure CORS for the Flask application.
    
    Args:
        app: Flask application instance
    """
    # Get allowed origins from config
    allowed_origins = app.config.get('CORS_ORIGINS', ['http://localhost:3000'])
    
    # Configure CORS
    CORS(
        app,
        origins=allowed_origins,
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
        expose_headers=['Content-Type', 'X-Total-Count'],
        supports_credentials=True,
        max_age=600  # Cache preflight requests for 10 minutes
    )

"""
App package initialization.
"""
from .routes import register_routes
from .middleware import (
    configure_cors,
    register_error_handlers,
    ImageProcessingError,
    ValidationError
)

__all__ = [
    'register_routes',
    'configure_cors',
    'register_error_handlers',
    'ImageProcessingError',
    'ValidationError'
]

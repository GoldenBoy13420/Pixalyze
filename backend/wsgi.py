"""
WSGI entry point for production deployment.
"""
from backend.main import create_app
from backend.config import ProductionConfig

app = create_app(ProductionConfig)

if __name__ == '__main__':
    app.run()

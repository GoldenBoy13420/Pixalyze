"""
WSGI entry point for production deployment.
"""
from main import create_app
from config import ProductionConfig

app = create_app(ProductionConfig)

if __name__ == '__main__':
    app.run()

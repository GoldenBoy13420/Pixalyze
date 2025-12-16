"""
Tests for API endpoints.
"""
import pytest
import sys
import os
import io
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import create_app
from config import TestingConfig


@pytest.fixture
def app():
    """Create test application."""
    app = create_app(TestingConfig)
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def sample_image_bytes():
    """Create sample image as bytes."""
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes


@pytest.fixture
def uploaded_image_id(client, sample_image_bytes):
    """Upload an image and return its ID."""
    response = client.post(
        '/api/images/upload',
        data={'file': (sample_image_bytes, 'test.png')},
        content_type='multipart/form-data'
    )
    assert response.status_code == 201
    return response.get_json()['image_id']


class TestHealthCheck:
    """Tests for health check endpoint."""
    
    def test_health_check(self, client):
        """Test health check endpoint returns healthy status."""
        response = client.get('/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'healthy'


class TestImageRoutes:
    """Tests for image routes."""
    
    def test_upload_image(self, client, sample_image_bytes):
        """Test image upload."""
        response = client.post(
            '/api/images/upload',
            data={'file': (sample_image_bytes, 'test.png')},
            content_type='multipart/form-data'
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'image_id' in data
        assert data['success'] == True
    
    def test_upload_no_file(self, client):
        """Test upload without file."""
        response = client.post('/api/images/upload')
        
        assert response.status_code == 400
    
    def test_get_image(self, client, uploaded_image_id):
        """Test get image by ID."""
        response = client.get(f'/api/images/{uploaded_image_id}')
        
        assert response.status_code == 200
        assert response.content_type.startswith('image/')
    
    def test_get_image_metadata(self, client, uploaded_image_id):
        """Test get image metadata."""
        response = client.get(f'/api/images/{uploaded_image_id}?metadata=true')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'width' in data
        assert 'height' in data
    
    def test_get_nonexistent_image(self, client):
        """Test get non-existent image."""
        response = client.get('/api/images/nonexistent-id')
        
        assert response.status_code == 404
    
    def test_delete_image(self, client, uploaded_image_id):
        """Test delete image."""
        response = client.delete(f'/api/images/{uploaded_image_id}')
        
        assert response.status_code == 200
        
        # Verify it's deleted
        response = client.get(f'/api/images/{uploaded_image_id}')
        assert response.status_code == 404
    
    def test_list_images(self, client, uploaded_image_id):
        """Test list images."""
        response = client.get('/api/images/list')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'images' in data
        assert 'count' in data


class TestHistogramRoutes:
    """Tests for histogram routes."""
    
    def test_get_histogram(self, client, uploaded_image_id):
        """Test get histogram."""
        response = client.get(f'/api/histogram/{uploaded_image_id}')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'histogram' in data
    
    def test_equalize_histogram(self, client, uploaded_image_id):
        """Test histogram equalization."""
        response = client.post(
            '/api/histogram/equalize',
            json={'image_id': uploaded_image_id, 'method': 'global'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'result_image' in data
    
    def test_equalize_clahe(self, client, uploaded_image_id):
        """Test CLAHE equalization."""
        response = client.post(
            '/api/histogram/equalize',
            json={
                'image_id': uploaded_image_id,
                'method': 'clahe',
                'clip_limit': 2.0,
                'tile_size': 8
            }
        )
        
        assert response.status_code == 200
    
    def test_contrast_stretch(self, client, uploaded_image_id):
        """Test contrast stretching."""
        response = client.post(
            '/api/histogram/stretch',
            json={'image_id': uploaded_image_id}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'result_image' in data


class TestFilterRoutes:
    """Tests for filter routes."""
    
    def test_get_available_filters(self, client):
        """Test get available filters."""
        response = client.get('/api/filters/available')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'filters' in data
        assert 'blur' in data['filters']
    
    def test_apply_blur_filter(self, client, uploaded_image_id):
        """Test apply blur filter."""
        response = client.post(
            '/api/filters/apply',
            json={
                'image_id': uploaded_image_id,
                'filter_type': 'blur',
                'params': {'kernel_size': 5, 'sigma': 1.0}
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'result_image' in data
    
    def test_apply_edge_detection(self, client, uploaded_image_id):
        """Test apply edge detection."""
        response = client.post(
            '/api/filters/apply',
            json={
                'image_id': uploaded_image_id,
                'filter_type': 'edge_canny',
                'params': {'threshold1': 100, 'threshold2': 200}
            }
        )
        
        assert response.status_code == 200
    
    def test_apply_invalid_filter(self, client, uploaded_image_id):
        """Test apply invalid filter."""
        response = client.post(
            '/api/filters/apply',
            json={
                'image_id': uploaded_image_id,
                'filter_type': 'invalid_filter'
            }
        )
        
        assert response.status_code == 400


class TestFourierRoutes:
    """Tests for Fourier routes."""
    
    def test_compute_fft(self, client, uploaded_image_id):
        """Test FFT computation."""
        response = client.post(
            '/api/fourier/transform',
            json={'image_id': uploaded_image_id}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'magnitude_spectrum' in data
        assert 'phase_spectrum' in data
    
    def test_frequency_filter(self, client, uploaded_image_id):
        """Test frequency domain filter."""
        response = client.post(
            '/api/fourier/filter',
            json={
                'image_id': uploaded_image_id,
                'filter_type': 'lowpass',
                'cutoff': 0.3,
                'filter_method': 'gaussian'
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'result_image' in data
        assert 'filter_mask' in data
    
    def test_get_available_frequency_filters(self, client):
        """Test get available frequency filters."""
        response = client.get('/api/fourier/available')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'filters' in data


class TestNoiseRoutes:
    """Tests for noise routes."""
    
    def test_get_noise_types(self, client):
        """Test get noise types."""
        response = client.get('/api/noise/types')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'noise_types' in data
        assert 'gaussian' in data['noise_types']
    
    def test_add_gaussian_noise(self, client, uploaded_image_id):
        """Test add Gaussian noise."""
        response = client.post(
            '/api/noise/add',
            json={
                'image_id': uploaded_image_id,
                'noise_type': 'gaussian',
                'params': {'mean': 0, 'std': 25}
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'result_image' in data
    
    def test_add_salt_pepper_noise(self, client, uploaded_image_id):
        """Test add salt and pepper noise."""
        response = client.post(
            '/api/noise/add',
            json={
                'image_id': uploaded_image_id,
                'noise_type': 'salt_pepper',
                'params': {'amount': 0.05}
            }
        )
        
        assert response.status_code == 200
    
    def test_remove_noise(self, client, uploaded_image_id):
        """Test remove noise."""
        response = client.post(
            '/api/noise/remove',
            json={
                'image_id': uploaded_image_id,
                'method': 'median',
                'params': {'kernel_size': 5}
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'result_image' in data
    
    def test_estimate_noise(self, client, uploaded_image_id):
        """Test estimate noise level."""
        response = client.post(
            '/api/noise/estimate',
            json={'image_id': uploaded_image_id, 'method': 'mad'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'noise_level' in data


class TestErrorHandling:
    """Tests for error handling."""
    
    def test_404_error(self, client):
        """Test 404 error response."""
        response = client.get('/api/nonexistent/endpoint')
        
        assert response.status_code == 404
    
    def test_invalid_json(self, client, uploaded_image_id):
        """Test invalid JSON handling."""
        response = client.post(
            '/api/filters/apply',
            data='invalid json',
            content_type='application/json'
        )
        
        assert response.status_code in [400, 415, 500]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

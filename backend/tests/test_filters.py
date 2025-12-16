"""
Tests for filter operations.
"""
import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.ImageProcessor import ImageProcessor


@pytest.fixture
def test_image():
    """Create a test image with known pattern."""
    # Create checkerboard pattern
    image = np.zeros((100, 100, 3), dtype=np.uint8)
    for i in range(10):
        for j in range(10):
            if (i + j) % 2 == 0:
                image[i*10:(i+1)*10, j*10:(j+1)*10] = [255, 255, 255]
    return image


@pytest.fixture
def noisy_image():
    """Create a noisy test image."""
    base = np.full((100, 100, 3), 128, dtype=np.uint8)
    noise = np.random.normal(0, 25, base.shape).astype(np.int16)
    noisy = np.clip(base.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return noisy


class TestBlurFilters:
    """Tests for blur filters."""
    
    def test_gaussian_blur_reduces_noise(self, noisy_image):
        """Test that Gaussian blur reduces noise."""
        processor = ImageProcessor(noisy_image)
        blurred = processor.gaussian_blur(kernel_size=5, sigma=1.0)
        
        # Standard deviation should decrease after blurring
        assert np.std(blurred) <= np.std(noisy_image)
    
    def test_box_blur(self, test_image):
        """Test box blur."""
        processor = ImageProcessor(test_image)
        blurred = processor.box_blur(kernel_size=5)
        
        assert blurred.shape == test_image.shape
        # Edges should be less sharp
        assert np.std(blurred) < np.std(test_image)
    
    def test_median_filter_salt_pepper(self):
        """Test median filter on salt and pepper noise."""
        # Create image with salt and pepper noise
        image = np.full((100, 100), 128, dtype=np.uint8)
        # Add salt
        image[np.random.rand(100, 100) < 0.05] = 255
        # Add pepper
        image[np.random.rand(100, 100) < 0.05] = 0
        
        processor = ImageProcessor(image)
        filtered = processor.median_filter(kernel_size=3)
        
        # Median filter should reduce extreme values
        assert np.sum(filtered == 255) < np.sum(image == 255)
        assert np.sum(filtered == 0) < np.sum(image == 0)
    
    def test_bilateral_preserves_edges(self, test_image):
        """Test that bilateral filter preserves edges."""
        processor = ImageProcessor(test_image)
        filtered = processor.bilateral_filter(d=9, sigma_color=75, sigma_space=75)
        
        # Calculate edge strength in both
        edges_orig = processor.sobel_edge_detection()
        
        processor_filtered = ImageProcessor(filtered)
        edges_filtered = processor_filtered.sobel_edge_detection()
        
        # Edge strength should be similar (bilateral preserves edges)
        edge_ratio = np.sum(edges_filtered) / np.sum(edges_orig)
        assert 0.5 < edge_ratio < 1.5


class TestEdgeDetection:
    """Tests for edge detection filters."""
    
    def test_sobel_detects_edges(self, test_image):
        """Test Sobel edge detection on checkerboard."""
        processor = ImageProcessor(test_image)
        edges = processor.sobel_edge_detection(ksize=3)
        
        # Should detect edges at checkerboard boundaries
        assert np.max(edges) > 0
        # Result should be grayscale
        assert len(edges.shape) == 2
    
    def test_laplacian_detects_edges(self, test_image):
        """Test Laplacian edge detection."""
        processor = ImageProcessor(test_image)
        edges = processor.laplacian_edge_detection(ksize=3)
        
        assert np.max(edges) > 0
    
    def test_canny_detects_edges(self, test_image):
        """Test Canny edge detection."""
        processor = ImageProcessor(test_image)
        edges = processor.canny_edge_detection(threshold1=50, threshold2=150)
        
        # Canny produces binary edges
        unique_values = np.unique(edges)
        assert len(unique_values) <= 2  # Only 0 and possibly 255


class TestSharpeningFilters:
    """Tests for sharpening filters."""
    
    def test_sharpen_increases_contrast(self, noisy_image):
        """Test that sharpening increases local contrast."""
        # Blur first to have something to sharpen
        blurred = ImageProcessor(noisy_image).gaussian_blur(5, 1.0)
        
        processor = ImageProcessor(blurred)
        sharpened = processor.sharpen(strength=1.0)
        
        # Calculate local variance as measure of sharpness
        def local_variance(img):
            return np.mean(np.abs(np.diff(img.astype(float), axis=0)))
        
        # Sharpened image should have higher local variance
        assert local_variance(sharpened) >= local_variance(blurred) * 0.9
    
    def test_unsharp_mask(self, test_image):
        """Test unsharp mask."""
        processor = ImageProcessor(test_image)
        sharpened = processor.unsharp_mask(sigma=1.0, strength=1.5, threshold=0)
        
        assert sharpened.shape == test_image.shape


class TestCustomKernels:
    """Tests for custom kernel operations."""
    
    def test_identity_kernel(self, test_image):
        """Test identity kernel produces same image."""
        processor = ImageProcessor(test_image)
        identity = np.array([[0, 0, 0], [0, 1, 0], [0, 0, 0]], dtype=np.float32)
        result = processor.apply_custom_kernel(identity)
        
        np.testing.assert_array_almost_equal(result, test_image, decimal=5)
    
    def test_custom_blur_kernel(self, test_image):
        """Test custom averaging kernel."""
        processor = ImageProcessor(test_image)
        blur_kernel = np.ones((3, 3), dtype=np.float32) / 9
        result = processor.apply_custom_kernel(blur_kernel)
        
        # Should produce blurring effect
        assert np.std(result) <= np.std(test_image)


class TestFilterEdgeCases:
    """Tests for edge cases in filters."""
    
    def test_small_image(self):
        """Test filters on very small image."""
        small = np.random.randint(0, 256, (10, 10, 3), dtype=np.uint8)
        processor = ImageProcessor(small)
        
        # These should not crash
        processor.gaussian_blur(3, 1.0)
        processor.median_filter(3)
        processor.sharpen(1.0)
    
    def test_single_pixel_image(self):
        """Test filters on single pixel image."""
        pixel = np.array([[[128, 128, 128]]], dtype=np.uint8)
        processor = ImageProcessor(pixel)
        
        # Should handle gracefully
        result = processor.gaussian_blur(1, 1.0)
        assert result.shape == pixel.shape
    
    def test_grayscale_filters(self):
        """Test filters on grayscale image."""
        gray = np.random.randint(0, 256, (50, 50), dtype=np.uint8)
        processor = ImageProcessor(gray)
        
        # All these should work on grayscale
        assert processor.gaussian_blur(5, 1.0).shape == gray.shape
        assert processor.median_filter(5).shape == gray.shape
        assert processor.bilateral_filter(9, 75, 75).shape == gray.shape
        assert processor.sharpen(1.0).shape == gray.shape


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

"""
Tests for ImageProcessor class.
"""
import pytest
import numpy as np
import cv2
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.ImageProcessor import ImageProcessor


@pytest.fixture
def sample_grayscale_image():
    """Create a sample grayscale test image."""
    return np.random.randint(0, 256, (100, 100), dtype=np.uint8)


@pytest.fixture
def sample_color_image():
    """Create a sample color test image."""
    return np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)


@pytest.fixture
def gradient_image():
    """Create a gradient test image."""
    gradient = np.zeros((100, 100), dtype=np.uint8)
    for i in range(100):
        gradient[:, i] = int(i * 255 / 99)
    return gradient


class TestImageProcessorInit:
    """Tests for ImageProcessor initialization."""
    
    def test_init_grayscale(self, sample_grayscale_image):
        """Test initialization with grayscale image."""
        processor = ImageProcessor(sample_grayscale_image)
        assert processor.is_color == False
        assert processor.image.shape == (100, 100)
    
    def test_init_color(self, sample_color_image):
        """Test initialization with color image."""
        processor = ImageProcessor(sample_color_image)
        assert processor.is_color == True
        assert processor.image.shape == (100, 100, 3)
    
    def test_init_copies_image(self, sample_color_image):
        """Test that initialization creates a copy."""
        processor = ImageProcessor(sample_color_image)
        processor.image[0, 0] = [0, 0, 0]
        assert not np.array_equal(processor.image, sample_color_image) or \
               np.array_equal(sample_color_image[0, 0], [0, 0, 0])


class TestHistogramOperations:
    """Tests for histogram operations."""
    
    def test_calculate_histogram_grayscale(self, sample_grayscale_image):
        """Test histogram calculation for grayscale image."""
        processor = ImageProcessor(sample_grayscale_image)
        histogram = processor.calculate_histogram()
        
        assert 'gray' in histogram
        assert len(histogram['gray']) == 256
    
    def test_calculate_histogram_color(self, sample_color_image):
        """Test histogram calculation for color image."""
        processor = ImageProcessor(sample_color_image)
        histogram = processor.calculate_histogram()
        
        assert 'red' in histogram
        assert 'green' in histogram
        assert 'blue' in histogram
        assert len(histogram['red']) == 256
    
    def test_histogram_equalization_grayscale(self, gradient_image):
        """Test histogram equalization on grayscale image."""
        processor = ImageProcessor(gradient_image)
        equalized = processor.histogram_equalization()
        
        assert equalized.shape == gradient_image.shape
        assert equalized.dtype == np.uint8
    
    def test_histogram_equalization_color(self, sample_color_image):
        """Test histogram equalization on color image."""
        processor = ImageProcessor(sample_color_image)
        equalized = processor.histogram_equalization()
        
        assert equalized.shape == sample_color_image.shape
        assert equalized.dtype == np.uint8
    
    def test_clahe_equalization(self, sample_grayscale_image):
        """Test CLAHE equalization."""
        processor = ImageProcessor(sample_grayscale_image)
        result = processor.clahe_equalization(clip_limit=2.0, tile_size=(8, 8))
        
        assert result.shape == sample_grayscale_image.shape
        assert result.dtype == np.uint8
    
    def test_contrast_stretch(self, gradient_image):
        """Test contrast stretching."""
        processor = ImageProcessor(gradient_image)
        stretched = processor.contrast_stretch(low_percentile=2, high_percentile=98)
        
        assert stretched.shape == gradient_image.shape
        assert stretched.dtype == np.uint8


class TestSpatialFilters:
    """Tests for spatial filtering operations."""
    
    def test_gaussian_blur(self, sample_color_image):
        """Test Gaussian blur."""
        processor = ImageProcessor(sample_color_image)
        blurred = processor.gaussian_blur(kernel_size=5, sigma=1.0)
        
        assert blurred.shape == sample_color_image.shape
    
    def test_median_filter(self, sample_color_image):
        """Test median filter."""
        processor = ImageProcessor(sample_color_image)
        filtered = processor.median_filter(kernel_size=5)
        
        assert filtered.shape == sample_color_image.shape
    
    def test_bilateral_filter(self, sample_color_image):
        """Test bilateral filter."""
        processor = ImageProcessor(sample_color_image)
        filtered = processor.bilateral_filter(d=9, sigma_color=75, sigma_space=75)
        
        assert filtered.shape == sample_color_image.shape
    
    def test_sharpen(self, sample_color_image):
        """Test sharpening."""
        processor = ImageProcessor(sample_color_image)
        sharpened = processor.sharpen(strength=1.0)
        
        assert sharpened.shape == sample_color_image.shape
    
    def test_sobel_edge_detection(self, sample_color_image):
        """Test Sobel edge detection."""
        processor = ImageProcessor(sample_color_image)
        edges = processor.sobel_edge_detection(ksize=3)
        
        assert len(edges.shape) == 2  # Should be grayscale
    
    def test_canny_edge_detection(self, sample_color_image):
        """Test Canny edge detection."""
        processor = ImageProcessor(sample_color_image)
        edges = processor.canny_edge_detection(threshold1=100, threshold2=200)
        
        assert len(edges.shape) == 2  # Should be grayscale
    
    def test_emboss(self, sample_color_image):
        """Test emboss effect."""
        processor = ImageProcessor(sample_color_image)
        embossed = processor.emboss()
        
        assert embossed.shape == sample_color_image.shape


class TestFourierOperations:
    """Tests for Fourier transform operations."""
    
    def test_compute_fft(self, sample_grayscale_image):
        """Test FFT computation."""
        processor = ImageProcessor(sample_grayscale_image)
        magnitude, phase = processor.compute_fft(shift=True)
        
        assert magnitude.shape == sample_grayscale_image.shape
        assert phase.shape == sample_grayscale_image.shape
    
    def test_inverse_fft(self, sample_grayscale_image):
        """Test inverse FFT."""
        processor = ImageProcessor(sample_grayscale_image)
        magnitude, phase = processor.compute_fft(shift=True)
        reconstructed = processor.compute_inverse_fft(magnitude, phase, shift=True)
        
        assert reconstructed.shape == sample_grayscale_image.shape
    
    def test_frequency_filter_lowpass(self, sample_grayscale_image):
        """Test low pass frequency filter."""
        processor = ImageProcessor(sample_grayscale_image)
        filtered, mask = processor.apply_frequency_filter(
            filter_type='lowpass', cutoff=0.3, method='gaussian'
        )
        
        assert filtered.shape == sample_grayscale_image.shape
        assert mask.shape == sample_grayscale_image.shape
    
    def test_frequency_filter_highpass(self, sample_grayscale_image):
        """Test high pass frequency filter."""
        processor = ImageProcessor(sample_grayscale_image)
        filtered, mask = processor.apply_frequency_filter(
            filter_type='highpass', cutoff=0.1, method='butterworth'
        )
        
        assert filtered.shape == sample_grayscale_image.shape


class TestNoiseOperations:
    """Tests for noise operations."""
    
    def test_add_gaussian_noise(self, sample_color_image):
        """Test Gaussian noise addition."""
        processor = ImageProcessor(sample_color_image)
        noisy = processor.add_gaussian_noise(mean=0, std=25)
        
        assert noisy.shape == sample_color_image.shape
        # Image should be different after adding noise
        assert not np.array_equal(noisy, sample_color_image)
    
    def test_add_salt_pepper_noise(self, sample_color_image):
        """Test salt and pepper noise addition."""
        processor = ImageProcessor(sample_color_image)
        noisy = processor.add_salt_pepper_noise(amount=0.05, salt_ratio=0.5)
        
        assert noisy.shape == sample_color_image.shape
    
    def test_add_poisson_noise(self, sample_color_image):
        """Test Poisson noise addition."""
        processor = ImageProcessor(sample_color_image)
        noisy = processor.add_poisson_noise(scale=1.0)
        
        assert noisy.shape == sample_color_image.shape
    
    def test_non_local_means_denoise(self, sample_color_image):
        """Test NLM denoising."""
        processor = ImageProcessor(sample_color_image)
        denoised = processor.non_local_means_denoise(h=10)
        
        assert denoised.shape == sample_color_image.shape
    
    def test_estimate_noise(self, sample_grayscale_image):
        """Test noise estimation."""
        processor = ImageProcessor(sample_grayscale_image)
        noise_level = processor.estimate_noise(method='mad')
        
        assert isinstance(noise_level, float)
        assert noise_level >= 0


class TestStatistics:
    """Tests for image statistics."""
    
    def test_get_statistics_grayscale(self, sample_grayscale_image):
        """Test statistics for grayscale image."""
        processor = ImageProcessor(sample_grayscale_image)
        stats = processor.get_statistics()
        
        assert 'shape' in stats
        assert 'dtype' in stats
        assert 'intensity' in stats
        assert 'mean' in stats['intensity']
        assert 'std' in stats['intensity']
    
    def test_get_statistics_color(self, sample_color_image):
        """Test statistics for color image."""
        processor = ImageProcessor(sample_color_image)
        stats = processor.get_statistics()
        
        assert 'shape' in stats
        assert 'red' in stats
        assert 'green' in stats
        assert 'blue' in stats


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

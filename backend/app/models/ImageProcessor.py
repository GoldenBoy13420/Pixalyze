"""
Image Processor - Core image processing class.
Provides comprehensive image processing functionality.
"""
import cv2
import numpy as np
from scipy import ndimage
from scipy.signal import wiener
from typing import Tuple, Optional, List, Dict, Any


class ImageProcessor:
    """
    Core image processing class providing various operations including:
    - Histogram operations
    - Spatial filtering
    - Frequency domain operations
    - Noise handling
    """
    
    def __init__(self, image: np.ndarray):
        """
        Initialize the processor with an image.
        
        Args:
            image: Input image as numpy array (BGR or grayscale)
        """
        self.image = image.copy()
        self.is_color = len(image.shape) == 3 and image.shape[2] == 3
        
    def to_grayscale(self) -> np.ndarray:
        """Convert image to grayscale."""
        if self.is_color:
            return cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        return self.image.copy()
    
    # ==================== Histogram Operations ====================
    
    def calculate_histogram(self) -> Dict[str, List[int]]:
        """
        Calculate histogram for the image.
        
        Returns:
            Dictionary with histogram data for each channel
        """
        histograms = {}
        
        if self.is_color:
            colors = ('blue', 'green', 'red')
            for i, color in enumerate(colors):
                hist = cv2.calcHist([self.image], [i], None, [256], [0, 256])
                histograms[color] = hist.flatten().tolist()
        else:
            hist = cv2.calcHist([self.image], [0], None, [256], [0, 256])
            histograms['gray'] = hist.flatten().tolist()
        
        return histograms
    
    def histogram_equalization(self) -> np.ndarray:
        """
        Perform global histogram equalization.
        
        Returns:
            Equalized image
        """
        if self.is_color:
            # Convert to YCrCb, equalize Y channel
            ycrcb = cv2.cvtColor(self.image, cv2.COLOR_BGR2YCrCb)
            ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
            return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
        else:
            return cv2.equalizeHist(self.image)
    
    def clahe_equalization(self, clip_limit: float = 2.0, 
                          tile_size: Tuple[int, int] = (8, 8)) -> np.ndarray:
        """
        Perform CLAHE (Contrast Limited Adaptive Histogram Equalization).
        
        Args:
            clip_limit: Threshold for contrast limiting
            tile_size: Size of grid for histogram equalization
        
        Returns:
            CLAHE equalized image
        """
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_size)
        
        if self.is_color:
            lab = cv2.cvtColor(self.image, cv2.COLOR_BGR2LAB)
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        else:
            return clahe.apply(self.image)
    
    def adaptive_histogram_equalization(self) -> np.ndarray:
        """Alias for CLAHE with default parameters."""
        return self.clahe_equalization()
    
    def contrast_stretch(self, low_percentile: int = 2, 
                        high_percentile: int = 98) -> np.ndarray:
        """
        Perform contrast stretching.
        
        Args:
            low_percentile: Lower percentile for stretching
            high_percentile: Upper percentile for stretching
        
        Returns:
            Contrast stretched image
        """
        if self.is_color:
            result = np.zeros_like(self.image)
            for i in range(3):
                channel = self.image[:, :, i]
                p_low = np.percentile(channel, low_percentile)
                p_high = np.percentile(channel, high_percentile)
                result[:, :, i] = np.clip(
                    (channel - p_low) * 255.0 / (p_high - p_low), 0, 255
                ).astype(np.uint8)
            return result
        else:
            p_low = np.percentile(self.image, low_percentile)
            p_high = np.percentile(self.image, high_percentile)
            return np.clip(
                (self.image - p_low) * 255.0 / (p_high - p_low), 0, 255
            ).astype(np.uint8)
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistical information about the image.
        
        Returns:
            Dictionary with image statistics
        """
        stats = {
            'shape': self.image.shape,
            'dtype': str(self.image.dtype),
            'is_color': self.is_color
        }
        
        if self.is_color:
            for i, channel in enumerate(['blue', 'green', 'red']):
                ch = self.image[:, :, i]
                stats[channel] = {
                    'mean': float(np.mean(ch)),
                    'std': float(np.std(ch)),
                    'min': int(np.min(ch)),
                    'max': int(np.max(ch)),
                    'median': float(np.median(ch))
                }
        else:
            stats['intensity'] = {
                'mean': float(np.mean(self.image)),
                'std': float(np.std(self.image)),
                'min': int(np.min(self.image)),
                'max': int(np.max(self.image)),
                'median': float(np.median(self.image))
            }
        
        return stats
    
    # ==================== Spatial Filters ====================
    
    def gaussian_blur(self, kernel_size: int = 5, sigma: float = 1.0) -> np.ndarray:
        """Apply Gaussian blur."""
        if kernel_size % 2 == 0:
            kernel_size += 1
        return cv2.GaussianBlur(self.image, (kernel_size, kernel_size), sigma)
    
    def box_blur(self, kernel_size: int = 5) -> np.ndarray:
        """Apply box (average) blur."""
        if kernel_size % 2 == 0:
            kernel_size += 1
        return cv2.blur(self.image, (kernel_size, kernel_size))
    
    def median_filter(self, kernel_size: int = 5) -> np.ndarray:
        """Apply median filter."""
        if kernel_size % 2 == 0:
            kernel_size += 1
        return cv2.medianBlur(self.image, kernel_size)
    
    def bilateral_filter(self, d: int = 9, sigma_color: float = 75, 
                        sigma_space: float = 75) -> np.ndarray:
        """Apply bilateral filter."""
        return cv2.bilateralFilter(self.image, d, sigma_color, sigma_space)
    
    def sharpen(self, strength: float = 1.0) -> np.ndarray:
        """Apply sharpening filter."""
        kernel = np.array([
            [0, -1, 0],
            [-1, 5 + strength, -1],
            [0, -1, 0]
        ])
        return cv2.filter2D(self.image, -1, kernel)
    
    def unsharp_mask(self, sigma: float = 1.0, strength: float = 1.5, 
                    threshold: int = 0) -> np.ndarray:
        """Apply unsharp masking."""
        blurred = cv2.GaussianBlur(self.image, (0, 0), sigma)
        sharpened = cv2.addWeighted(self.image, 1 + strength, blurred, -strength, 0)
        
        if threshold > 0:
            low_contrast_mask = np.abs(self.image.astype(float) - blurred) < threshold
            np.copyto(sharpened, self.image, where=low_contrast_mask)
        
        return sharpened
    
    def sobel_edge_detection(self, ksize: int = 3) -> np.ndarray:
        """Apply Sobel edge detection."""
        gray = self.to_grayscale()
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=ksize)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=ksize)
        magnitude = np.sqrt(sobelx**2 + sobely**2)
        return np.uint8(np.clip(magnitude, 0, 255))
    
    def laplacian_edge_detection(self, ksize: int = 3) -> np.ndarray:
        """Apply Laplacian edge detection."""
        gray = self.to_grayscale()
        laplacian = cv2.Laplacian(gray, cv2.CV_64F, ksize=ksize)
        return np.uint8(np.clip(np.abs(laplacian), 0, 255))
    
    def canny_edge_detection(self, threshold1: float = 100, 
                            threshold2: float = 200) -> np.ndarray:
        """Apply Canny edge detection."""
        gray = self.to_grayscale()
        return cv2.Canny(gray, threshold1, threshold2)
    
    def emboss(self) -> np.ndarray:
        """Apply emboss effect."""
        kernel = np.array([
            [-2, -1, 0],
            [-1, 1, 1],
            [0, 1, 2]
        ])
        return cv2.filter2D(self.image, -1, kernel)
    
    def high_pass_filter(self, kernel_size: int = 3) -> np.ndarray:
        """Apply high pass filter."""
        blurred = cv2.GaussianBlur(self.image, (kernel_size, kernel_size), 0)
        high_pass = cv2.subtract(self.image, blurred)
        return cv2.add(self.image, high_pass)
    
    def low_pass_filter(self, kernel_size: int = 5) -> np.ndarray:
        """Apply low pass filter (smoothing)."""
        return cv2.GaussianBlur(self.image, (kernel_size, kernel_size), 0)
    
    def apply_custom_kernel(self, kernel: np.ndarray) -> np.ndarray:
        """Apply a custom convolution kernel."""
        return cv2.filter2D(self.image, -1, kernel)
    
    # ==================== Fourier Transform Operations ====================
    
    def compute_fft(self, shift: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute 2D FFT of the image.
        
        Args:
            shift: Whether to shift zero frequency to center
        
        Returns:
            Tuple of (magnitude_spectrum, phase_spectrum)
        """
        gray = self.to_grayscale()
        f = np.fft.fft2(gray.astype(np.float32))
        
        if shift:
            f = np.fft.fftshift(f)
        
        magnitude = np.abs(f)
        phase = np.angle(f)
        
        return magnitude, phase
    
    def compute_inverse_fft(self, magnitude: np.ndarray, phase: np.ndarray, 
                           shift: bool = True) -> np.ndarray:
        """
        Compute inverse FFT from magnitude and phase.
        
        Args:
            magnitude: Magnitude spectrum
            phase: Phase spectrum
            shift: Whether to inverse shift
        
        Returns:
            Reconstructed image
        """
        f = magnitude * np.exp(1j * phase)
        
        if shift:
            f = np.fft.ifftshift(f)
        
        reconstructed = np.fft.ifft2(f).real
        return np.uint8(np.clip(reconstructed, 0, 255))
    
    def visualize_fft_magnitude(self, magnitude: np.ndarray) -> np.ndarray:
        """Create visualization of magnitude spectrum with log scaling."""
        magnitude_log = np.log1p(magnitude)
        normalized = (magnitude_log / magnitude_log.max() * 255).astype(np.uint8)
        return normalized
    
    def visualize_fft_phase(self, phase: np.ndarray) -> np.ndarray:
        """Create visualization of phase spectrum."""
        normalized = ((phase + np.pi) / (2 * np.pi) * 255).astype(np.uint8)
        return normalized
    
    def apply_frequency_filter(self, filter_type: str = 'lowpass',
                              cutoff: float = 0.3, cutoff_high: float = 0.7,
                              order: int = 2, method: str = 'gaussian') -> Tuple[np.ndarray, np.ndarray]:
        """
        Apply frequency domain filtering.
        
        Args:
            filter_type: 'lowpass', 'highpass', 'bandpass', 'bandstop'
            cutoff: Normalized cutoff frequency (0-1)
            cutoff_high: High cutoff for bandpass/bandstop
            order: Order for Butterworth filter
            method: 'ideal', 'gaussian', 'butterworth'
        
        Returns:
            Tuple of (filtered_image, filter_mask)
        """
        gray = self.to_grayscale()
        rows, cols = gray.shape
        crow, ccol = rows // 2, cols // 2
        
        # Create distance matrix from center
        u = np.arange(rows)
        v = np.arange(cols)
        u, v = np.meshgrid(u - crow, v - ccol, indexing='ij')
        d = np.sqrt(u**2 + v**2)
        
        # Normalize distance
        d_max = np.sqrt(crow**2 + ccol**2)
        d_normalized = d / d_max
        
        # Create filter mask based on method and type
        if method == 'ideal':
            mask = self._ideal_filter(d_normalized, filter_type, cutoff, cutoff_high)
        elif method == 'gaussian':
            mask = self._gaussian_filter(d_normalized, filter_type, cutoff, cutoff_high)
        else:  # butterworth
            mask = self._butterworth_filter(d_normalized, filter_type, cutoff, cutoff_high, order)
        
        # Apply filter in frequency domain
        f = np.fft.fft2(gray.astype(np.float32))
        f_shifted = np.fft.fftshift(f)
        f_filtered = f_shifted * mask
        f_unshifted = np.fft.ifftshift(f_filtered)
        filtered = np.fft.ifft2(f_unshifted).real
        
        return np.uint8(np.clip(filtered, 0, 255)), mask
    
    def _ideal_filter(self, d: np.ndarray, filter_type: str, 
                     cutoff: float, cutoff_high: float) -> np.ndarray:
        """Create ideal frequency filter."""
        if filter_type == 'lowpass':
            return (d <= cutoff).astype(float)
        elif filter_type == 'highpass':
            return (d > cutoff).astype(float)
        elif filter_type == 'bandpass':
            return ((d >= cutoff) & (d <= cutoff_high)).astype(float)
        else:  # bandstop
            return ((d < cutoff) | (d > cutoff_high)).astype(float)
    
    def _gaussian_filter(self, d: np.ndarray, filter_type: str,
                        cutoff: float, cutoff_high: float) -> np.ndarray:
        """Create Gaussian frequency filter."""
        if filter_type == 'lowpass':
            return np.exp(-d**2 / (2 * cutoff**2))
        elif filter_type == 'highpass':
            return 1 - np.exp(-d**2 / (2 * cutoff**2))
        elif filter_type == 'bandpass':
            low = np.exp(-d**2 / (2 * cutoff_high**2))
            high = 1 - np.exp(-d**2 / (2 * cutoff**2))
            return low * high
        else:  # bandstop
            return 1 - self._gaussian_filter(d, 'bandpass', cutoff, cutoff_high)
    
    def _butterworth_filter(self, d: np.ndarray, filter_type: str,
                           cutoff: float, cutoff_high: float, order: int) -> np.ndarray:
        """Create Butterworth frequency filter."""
        eps = 1e-10  # Avoid division by zero
        
        if filter_type == 'lowpass':
            return 1 / (1 + (d / (cutoff + eps))**(2 * order))
        elif filter_type == 'highpass':
            return 1 / (1 + ((cutoff + eps) / (d + eps))**(2 * order))
        elif filter_type == 'bandpass':
            w = cutoff_high - cutoff
            center = (cutoff + cutoff_high) / 2
            return 1 / (1 + ((d * w) / (d**2 - center**2 + eps))**(2 * order))
        else:  # bandstop
            return 1 - self._butterworth_filter(d, 'bandpass', cutoff, cutoff_high, order)
    
    def homomorphic_filter(self, gamma_low: float = 0.3, gamma_high: float = 1.5,
                          cutoff: float = 30, c: float = 1) -> np.ndarray:
        """
        Apply homomorphic filtering for illumination correction.
        
        Args:
            gamma_low: Low frequency gain
            gamma_high: High frequency gain
            cutoff: Cutoff frequency
            c: Constant for sharpness
        
        Returns:
            Filtered image
        """
        gray = self.to_grayscale().astype(np.float32)
        
        # Add small value to avoid log(0)
        gray = np.log1p(gray)
        
        # FFT
        rows, cols = gray.shape
        crow, ccol = rows // 2, cols // 2
        
        f = np.fft.fft2(gray)
        f_shifted = np.fft.fftshift(f)
        
        # Create homomorphic filter
        u = np.arange(rows)
        v = np.arange(cols)
        u, v = np.meshgrid(u - crow, v - ccol, indexing='ij')
        d = np.sqrt(u**2 + v**2)
        
        H = (gamma_high - gamma_low) * (1 - np.exp(-c * (d**2 / cutoff**2))) + gamma_low
        
        # Apply filter
        f_filtered = f_shifted * H
        f_unshifted = np.fft.ifftshift(f_filtered)
        filtered = np.fft.ifft2(f_unshifted).real
        
        # Exponential to reverse log
        result = np.expm1(filtered)
        
        return np.uint8(np.clip(result, 0, 255))
    
    # ==================== Noise Operations ====================
    
    def add_gaussian_noise(self, mean: float = 0, std: float = 25) -> np.ndarray:
        """Add Gaussian noise to the image."""
        noise = np.random.normal(mean, std, self.image.shape)
        noisy = self.image.astype(np.float32) + noise
        return np.uint8(np.clip(noisy, 0, 255))
    
    def add_salt_pepper_noise(self, amount: float = 0.05, 
                             salt_ratio: float = 0.5) -> np.ndarray:
        """Add salt and pepper noise."""
        noisy = self.image.copy()
        total_pixels = self.image.size
        
        # Salt
        num_salt = int(total_pixels * amount * salt_ratio)
        salt_coords = [np.random.randint(0, i, num_salt) for i in self.image.shape[:2]]
        if self.is_color:
            noisy[salt_coords[0], salt_coords[1], :] = 255
        else:
            noisy[salt_coords[0], salt_coords[1]] = 255
        
        # Pepper
        num_pepper = int(total_pixels * amount * (1 - salt_ratio))
        pepper_coords = [np.random.randint(0, i, num_pepper) for i in self.image.shape[:2]]
        if self.is_color:
            noisy[pepper_coords[0], pepper_coords[1], :] = 0
        else:
            noisy[pepper_coords[0], pepper_coords[1]] = 0
        
        return noisy
    
    def add_poisson_noise(self, scale: float = 1.0) -> np.ndarray:
        """Add Poisson noise."""
        scaled = self.image.astype(np.float32) * scale
        noisy = np.random.poisson(scaled).astype(np.float32) / scale
        return np.uint8(np.clip(noisy, 0, 255))
    
    def add_speckle_noise(self, std: float = 0.1) -> np.ndarray:
        """Add speckle (multiplicative) noise."""
        noise = np.random.randn(*self.image.shape) * std
        noisy = self.image.astype(np.float32) * (1 + noise)
        return np.uint8(np.clip(noisy, 0, 255))
    
    def add_uniform_noise(self, low: float = -50, high: float = 50) -> np.ndarray:
        """Add uniform noise."""
        noise = np.random.uniform(low, high, self.image.shape)
        noisy = self.image.astype(np.float32) + noise
        return np.uint8(np.clip(noisy, 0, 255))
    
    def non_local_means_denoise(self, h: float = 10, 
                                template_window_size: int = 7,
                                search_window_size: int = 21) -> np.ndarray:
        """Apply Non-Local Means denoising."""
        if self.is_color:
            return cv2.fastNlMeansDenoisingColored(
                self.image, None, h, h, 
                template_window_size, search_window_size
            )
        else:
            return cv2.fastNlMeansDenoising(
                self.image, None, h,
                template_window_size, search_window_size
            )
    
    def morphological_denoise(self, kernel_size: int = 5, 
                             operation: str = 'opening') -> np.ndarray:
        """Apply morphological denoising."""
        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE, (kernel_size, kernel_size)
        )
        
        if operation == 'opening':
            return cv2.morphologyEx(self.image, cv2.MORPH_OPEN, kernel)
        elif operation == 'closing':
            return cv2.morphologyEx(self.image, cv2.MORPH_CLOSE, kernel)
        else:
            # Opening followed by closing
            opened = cv2.morphologyEx(self.image, cv2.MORPH_OPEN, kernel)
            return cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)
    
    def wiener_filter(self, noise_variance: Optional[float] = None) -> np.ndarray:
        """Apply Wiener filter for denoising."""
        if self.is_color:
            result = np.zeros_like(self.image)
            for i in range(3):
                result[:, :, i] = self._apply_wiener_channel(
                    self.image[:, :, i], noise_variance
                )
            return result
        else:
            return self._apply_wiener_channel(self.image, noise_variance)
    
    def _apply_wiener_channel(self, channel: np.ndarray, 
                             noise_variance: Optional[float]) -> np.ndarray:
        """Apply Wiener filter to a single channel."""
        if noise_variance is None:
            noise_variance = self._estimate_noise_variance(channel)
        
        # Simple Wiener implementation
        filtered = wiener(channel.astype(np.float32), 
                         noise=noise_variance if noise_variance else None)
        return np.uint8(np.clip(filtered, 0, 255))
    
    def _estimate_noise_variance(self, image: np.ndarray) -> float:
        """Estimate noise variance using MAD method."""
        # Use Laplacian to estimate noise
        laplacian = cv2.Laplacian(image, cv2.CV_64F)
        sigma = np.median(np.abs(laplacian)) / 0.6745
        return sigma ** 2
    
    def estimate_noise(self, method: str = 'mad') -> float:
        """
        Estimate noise level in the image.
        
        Args:
            method: Estimation method ('mad', 'laplacian', 'wavelet')
        
        Returns:
            Estimated noise standard deviation
        """
        gray = self.to_grayscale()
        
        if method == 'mad':
            # Median Absolute Deviation method
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            sigma = np.median(np.abs(laplacian)) / 0.6745
        elif method == 'laplacian':
            # Variance of Laplacian
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            sigma = np.sqrt(np.var(laplacian) / 2)
        else:
            # Simple difference-based estimation
            diff_h = np.diff(gray.astype(np.float32), axis=1)
            diff_v = np.diff(gray.astype(np.float32), axis=0)
            sigma = np.sqrt((np.var(diff_h) + np.var(diff_v)) / 2)
        
        return float(sigma)

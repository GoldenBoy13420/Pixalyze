# 📚 Pixalyze - Complete Documentation

<div align="center">

![Pixalyze](https://img.shields.io/badge/Pixalyze-Image%20Analysis-gradient?style=for-the-badge&logo=image&logoColor=white)

**Comprehensive Image Processing & Analysis Application**

*Version 1.0.0*

</div>

---

## 📑 Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture Overview](#2-architecture-overview)
3. [Installation & Setup](#3-installation--setup)
4. [Backend Documentation](#4-backend-documentation)
5. [Frontend Documentation](#5-frontend-documentation)
6. [API Reference](#6-api-reference)
7. [Image Processing Algorithms](#7-image-processing-algorithms)
8. [Configuration](#8-configuration)
9. [Docker Deployment](#9-docker-deployment)
10. [Troubleshooting](#10-troubleshooting)
11. [Contributing](#11-contributing)

---

## 1. Introduction

### 1.1 What is Pixalyze?

**Pixalyze** is a modern, full-stack web application for advanced image processing and analysis. It combines a powerful Python/Flask backend with a beautiful React frontend to provide an intuitive interface for complex image manipulation operations.

### 1.2 Key Features

| Category | Features |
|----------|----------|
| **Image Operations** | Upload, preview, and manage images (PNG, JPG, GIF, BMP, TIFF) |
| **Histogram Analysis** | Visualization, global equalization, CLAHE, contrast stretching |
| **Spatial Filters** | Blur, edge detection, sharpening, custom kernels |
| **Frequency Domain** | FFT visualization, low/high/band-pass filters, homomorphic filtering |
| **Noise Operations** | Add noise (Gaussian, Salt & Pepper, Poisson, etc.), denoise algorithms |

### 1.3 Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + Vite + Tailwind CSS + Framer Motion + Zustand   │
├─────────────────────────────────────────────────────────────┤
│                         REST API                             │
│                    JSON over HTTP/HTTPS                      │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                               │
│         Flask + OpenCV + NumPy + SciPy + scikit-image        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Overview

### 2.1 Project Structure

```
pixalyze/
├── backend/                    # Flask REST API
│   ├── app/
│   │   ├── __init__.py         # App factory
│   │   ├── middleware/         # CORS, error handling
│   │   ├── models/             # ImageProcessor class
│   │   ├── routes/             # API endpoints
│   │   └── utils/              # Helper functions
│   ├── tests/                  # Unit tests
│   ├── uploads/                # Uploaded images
│   ├── config.py               # Configuration classes
│   ├── main.py                 # Entry point
│   ├── wsgi.py                 # Production entry
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Page views
│   │   ├── services/           # API client
│   │   ├── store/              # Zustand state
│   │   ├── App.jsx             # Main app
│   │   └── main.jsx            # Entry point
│   ├── public/                 # Static assets
│   ├── package.json            # NPM dependencies
│   └── vite.config.js          # Vite configuration
│
├── docker/                     # Docker configuration
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── README.md                   # Quick start guide
└── LICENSE                     # MIT License
```

### 2.2 Data Flow Diagram

```
┌──────────────┐    HTTP/JSON     ┌──────────────┐
│   Frontend   │◄────────────────►│   Backend    │
│   (React)    │                  │   (Flask)    │
└──────────────┘                  └──────────────┘
       │                                 │
       │                                 │
       ▼                                 ▼
┌──────────────┐                  ┌──────────────┐
│   Zustand    │                  │   OpenCV     │
│   (State)    │                  │   NumPy      │
└──────────────┘                  │   SciPy      │
                                  └──────────────┘
```

### 2.3 Component Architecture

```
App.jsx
├── Layout
│   ├── Header
│   └── Sidebar (navigation)
├── Pages
│   ├── Home (gallery + upload)
│   └── Editor (main workspace)
└── Components
    ├── ImageUpload (drag & drop)
    ├── HistogramPanel (charts + equalization)
    ├── FilterPanel (spatial filters)
    ├── FourierPanel (FFT + frequency filters)
    ├── NoisePanel (add/remove noise)
    └── ResultsDisplay (before/after comparison)
```

---

## 3. Installation & Setup

### 3.1 Prerequisites

| Software | Minimum Version | Purpose |
|----------|-----------------|---------|
| Python | 3.9+ | Backend runtime |
| Node.js | 18+ | Frontend build/dev |
| npm/yarn | Latest | Package management |
| Git | 2.0+ | Version control |

### 3.2 Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create uploads directory (if not exists)
mkdir uploads

# Run development server
python main.py
```

The backend will start at `http://localhost:5000`

### 3.3 Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The frontend will start at `http://localhost:5173` (Vite default)

### 3.4 Environment Variables

**Backend (.env)**
```env
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=16777216
```

---

## 4. Backend Documentation

### 4.1 Flask Application Factory

The application uses Flask's factory pattern for flexible configuration:

```python
# backend/app/__init__.py
def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Register blueprints
    register_routes(app)
    
    # Configure CORS
    configure_cors(app)
    
    # Error handlers
    register_error_handlers(app)
    
    return app
```

### 4.2 Configuration Classes

```python
# backend/config.py
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = 'uploads'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
    MAX_IMAGE_DIMENSION = 4096
    DEFAULT_JPEG_QUALITY = 95

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
```

### 4.3 ImageProcessor Class

The core processing engine providing all image operations:

```python
class ImageProcessor:
    """
    Core image processing class.
    
    Attributes:
        image (np.ndarray): Input image (BGR or grayscale)
        is_color (bool): True if image has 3 channels
    
    Methods:
        - Histogram operations
        - Spatial filtering
        - Frequency domain operations
        - Noise handling
    """
    
    def __init__(self, image: np.ndarray, optimize_memory: bool = True):
        self.image = image
        self.is_color = len(image.shape) == 3 and image.shape[2] == 3
```

### 4.4 Route Blueprints

| Blueprint | Prefix | Purpose |
|-----------|--------|---------|
| `image_bp` | `/api/images` | Upload, retrieve, delete images |
| `histogram_bp` | `/api/histogram` | Histogram calculation & equalization |
| `filter_bp` | `/api/filters` | Spatial filter operations |
| `fourier_bp` | `/api/fourier` | FFT and frequency filtering |
| `noise_bp` | `/api/noise` | Noise addition & removal |

---

## 5. Frontend Documentation

### 5.1 Main Components

#### App.jsx
Main application shell with routing:

```jsx
function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </Layout>
  )
}
```

#### Editor.jsx
The main workspace that dynamically renders panels:

```jsx
const panels = {
  histogram: HistogramPanel,
  filters: FilterPanel,
  fourier: FourierPanel,
  noise: NoisePanel
}
```

### 5.2 State Management (Zustand)

The application uses Zustand for global state management:

```javascript
// store/useStore.js
const useStore = create(
  persist(
    (set, get) => ({
      // State
      currentImage: null,
      processedImage: null,
      histogram: null,
      fftData: null,
      isLoading: false,
      activeTab: 'upload',
      savedImages: [],
      
      // Actions
      uploadImage: async (file) => { ... },
      applyFilter: async (filterType, params) => { ... },
      calculateHistogram: async () => { ... },
      computeFFT: async () => { ... },
      addNoise: async (type, params) => { ... },
      removeNoise: async (method, params) => { ... },
    }),
    { name: 'pixalyze-storage' }
  )
)
```

### 5.3 API Service Layer

Centralized API client with caching and request cancellation:

```javascript
// services/api.js
const api = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT
})

// Available APIs
export const imageAPI = { upload, get, delete, list }
export const histogramAPI = { calculate, equalize, contrastStretch }
export const filterAPI = { getAvailable, apply }
export const fourierAPI = { transform, inverse, filter }
export const noiseAPI = { getTypes, add, remove }
```

### 5.4 Component Panels

#### HistogramPanel
- Displays intensity distribution chart (using Recharts)
- Supports RGB and grayscale histograms
- Equalization methods: Global, CLAHE, Adaptive
- Configurable CLAHE parameters (clip limit, tile size)

#### FilterPanel
- Categorized filter selection (Blur, Edge, Enhance, Frequency)
- Real-time parameter adjustment with sliders
- Includes educational explanations for each filter

#### FourierPanel
- Computes and displays FFT magnitude/phase spectrums
- Frequency domain filters: Low-pass, High-pass, Band-pass, Band-stop, Notch
- Filter methods: Ideal, Gaussian, Butterworth

#### NoisePanel
- Add noise: Gaussian, Salt & Pepper, Poisson, Speckle, Uniform
- Remove noise: Gaussian blur, Median, Bilateral, NLM, Morphological, Wiener

---

## 6. API Reference

### 6.1 Image Endpoints

#### Upload Image
```http
POST /api/images/upload
Content-Type: multipart/form-data

file: <binary>
```

**Response:**
```json
{
  "success": true,
  "image_id": "uuid-string",
  "filename": "example.jpg",
  "width": 1920,
  "height": 1080,
  "channels": 3
}
```

#### Get Image
```http
GET /api/images/{image_id}
```
Returns the image file.

#### Get Image Metadata
```http
GET /api/images/{image_id}?metadata=true
```

#### Delete Image
```http
DELETE /api/images/{image_id}
```

---

### 6.2 Histogram Endpoints

#### Calculate Histogram
```http
GET /api/histogram/{image_id}
```

**Response:**
```json
{
  "success": true,
  "image_id": "uuid",
  "histogram": {
    "red": [0, 5, 12, ...],
    "green": [0, 3, 8, ...],
    "blue": [1, 4, 10, ...]
  }
}
```

#### Histogram Equalization
```http
POST /api/histogram/equalize
Content-Type: application/json

{
  "image_id": "uuid",
  "method": "global" | "clahe" | "adaptive",
  "clip_limit": 2.0,      // CLAHE only
  "tile_size": 8          // CLAHE only
}
```

#### Contrast Stretching
```http
POST /api/histogram/stretch
Content-Type: application/json

{
  "image_id": "uuid",
  "low_percentile": 2,
  "high_percentile": 98
}
```

---

### 6.3 Filter Endpoints

#### Get Available Filters
```http
GET /api/filters/available
```

**Response:**
```json
{
  "success": true,
  "filters": {
    "blur": {
      "name": "Gaussian Blur",
      "params": ["kernel_size", "sigma"],
      "defaults": {"kernel_size": 5, "sigma": 1.0}
    },
    ...
  }
}
```

#### Apply Filter
```http
POST /api/filters/apply
Content-Type: application/json

{
  "image_id": "uuid",
  "filter_type": "blur",
  "params": {
    "kernel_size": 5,
    "sigma": 1.5
  }
}
```

**Available Filters:**

| Filter Type | Parameters | Description |
|------------|------------|-------------|
| `blur` | kernel_size, sigma | Gaussian blur |
| `box_blur` | kernel_size | Average blur |
| `median` | kernel_size | Median filter |
| `bilateral` | d, sigma_color, sigma_space | Edge-preserving blur |
| `sharpen` | strength | Sharpening |
| `unsharp_mask` | sigma, strength, threshold | Unsharp masking |
| `edge_sobel` | ksize | Sobel edge detection |
| `edge_laplacian` | ksize | Laplacian edge detection |
| `edge_canny` | threshold1, threshold2 | Canny edge detection |
| `emboss` | - | Emboss effect |
| `high_pass` | kernel_size | High pass filter |
| `low_pass` | kernel_size | Low pass filter |
| `custom` | kernel (3x3 matrix) | Custom convolution |

---

### 6.4 Fourier Transform Endpoints

#### Compute FFT
```http
POST /api/fourier/transform
Content-Type: application/json

{
  "image_id": "uuid",
  "shift": true,
  "log_scale": true
}
```

**Response:**
```json
{
  "success": true,
  "magnitude_spectrum": "data:image/png;base64,...",
  "phase_spectrum": "data:image/png;base64,..."
}
```

#### Apply Frequency Filter
```http
POST /api/fourier/filter
Content-Type: application/json

{
  "image_id": "uuid",
  "filter_type": "lowpass",
  "cutoff": 0.3,
  "cutoff_high": 0.7,        // bandpass/bandstop only
  "filter_order": 2,         // butterworth only
  "filter_method": "gaussian"
}
```

**Filter Types:**
- `lowpass` - Removes high frequencies (blurs)
- `highpass` - Removes low frequencies (sharpens)
- `bandpass` - Keeps specific frequency range
- `bandstop` - Removes specific frequency range
- `notch` - Removes periodic noise

**Filter Methods:**
- `ideal` - Sharp cutoff
- `gaussian` - Smooth transition
- `butterworth` - Controlled rolloff

#### Homomorphic Filter
```http
POST /api/fourier/homomorphic
Content-Type: application/json

{
  "image_id": "uuid",
  "gamma_low": 0.3,
  "gamma_high": 1.5,
  "cutoff": 30,
  "c": 1
}
```

---

### 6.5 Noise Endpoints

#### Get Noise Types
```http
GET /api/noise/types
```

#### Get Denoise Methods
```http
GET /api/noise/denoise-methods
```

#### Add Noise
```http
POST /api/noise/add
Content-Type: application/json

{
  "image_id": "uuid",
  "noise_type": "gaussian",
  "params": {
    "mean": 0,
    "std": 25
  }
}
```

**Noise Types:**

| Type | Parameters | Description |
|------|------------|-------------|
| `gaussian` | mean, std | Normal distribution noise |
| `salt_pepper` | amount, salt_ratio | Random black/white pixels |
| `poisson` | scale | Photon counting noise |
| `speckle` | std | Multiplicative noise |
| `uniform` | low, high | Uniform distribution noise |

#### Remove Noise
```http
POST /api/noise/remove
Content-Type: application/json

{
  "image_id": "uuid",
  "method": "median",
  "params": {
    "kernel_size": 5
  }
}
```

**Denoise Methods:**

| Method | Parameters | Best For |
|--------|------------|----------|
| `gaussian` | kernel_size, sigma | General smoothing |
| `median` | kernel_size | Salt & pepper noise |
| `bilateral` | d, sigma_color, sigma_space | Edge-preserving |
| `nlm` | h, template_window_size, search_window_size | High-quality denoising |
| `morphological` | kernel_size, operation | Binary images |
| `wiener` | noise_variance | Known noise stats |

---

## 7. Image Processing Algorithms

### 7.1 Histogram Operations

#### Histogram Calculation
```
For each intensity level i (0-255):
    histogram[i] = count of pixels with intensity i
```

#### Global Histogram Equalization
```
1. Calculate histogram h(i) for all intensity levels
2. Calculate cumulative distribution function (CDF):
   CDF(i) = Σ h(j) for j = 0 to i
3. Normalize CDF to range [0, 255]
4. Map each pixel: output(x,y) = CDF(input(x,y))
```

#### CLAHE (Contrast Limited Adaptive Histogram Equalization)
```
1. Divide image into tiles (e.g., 8x8 grid)
2. For each tile:
   a. Calculate histogram
   b. Clip histogram at clip_limit
   c. Redistribute clipped pixels
   d. Apply histogram equalization
3. Bilinear interpolation at tile boundaries
```

### 7.2 Spatial Filters

#### Gaussian Blur
```
Kernel formula: G(x,y) = (1/2πσ²) × e^(-(x²+y²)/2σ²)

Example 3x3 kernel (σ=1):
[0.075  0.124  0.075]
[0.124  0.204  0.124]
[0.075  0.124  0.075]
```

#### Sobel Edge Detection
```
Horizontal kernel (Gx):     Vertical kernel (Gy):
[-1  0  +1]                 [-1  -2  -1]
[-2  0  +2]                 [ 0   0   0]
[-1  0  +1]                 [+1  +2  +1]

Magnitude: G = √(Gx² + Gy²)
Direction: θ = arctan(Gy/Gx)
```

#### Canny Edge Detection
```
1. Gaussian blur to reduce noise
2. Calculate gradient magnitude and direction (Sobel)
3. Non-maximum suppression (thin edges)
4. Double thresholding (strong/weak edges)
5. Edge tracking by hysteresis
```

#### Sharpening
```
Kernel:
[ 0  -1   0]
[-1   5  -1]
[ 0  -1   0]

Or with strength parameter:
[ 0   -1    0]
[-1  5+α   -1]
[ 0   -1    0]
```

### 7.3 Frequency Domain Operations

#### Fast Fourier Transform (FFT)
```
F(u,v) = Σ Σ f(x,y) × e^(-j2π(ux/M + vy/N))

1. Convert image to grayscale
2. Apply 2D FFT
3. Shift zero frequency to center
4. Calculate magnitude: |F(u,v)|
5. Log transform for visualization: log(1 + |F(u,v)|)
```

#### Low-Pass Filter (Gaussian)
```
H(u,v) = e^(-D²(u,v) / 2D₀²)

Where D(u,v) = distance from center
      D₀ = cutoff frequency
```

#### High-Pass Filter (Gaussian)
```
H(u,v) = 1 - e^(-D²(u,v) / 2D₀²)
```

#### Butterworth Filter
```
Low-pass:  H(u,v) = 1 / (1 + (D(u,v)/D₀)^(2n))
High-pass: H(u,v) = 1 / (1 + (D₀/D(u,v))^(2n))

Where n = filter order (controls rolloff sharpness)
```

### 7.4 Noise Models

#### Gaussian Noise
```
noisy(x,y) = original(x,y) + N(μ, σ²)

Where N(μ, σ²) is random value from normal distribution
      μ = mean (usually 0)
      σ = standard deviation
```

#### Salt & Pepper Noise
```
For each pixel with probability 'amount':
    if random() < salt_ratio:
        pixel = 255 (salt)
    else:
        pixel = 0 (pepper)
```

#### Poisson Noise
```
noisy(x,y) = Poisson(original(x,y) × scale) / scale

Models photon counting: brighter areas have more noise variance
```

#### Speckle Noise (Multiplicative)
```
noisy(x,y) = original(x,y) × (1 + N(0, σ²))
```

### 7.5 Denoising Algorithms

#### Median Filter
```
output(x,y) = median(neighborhood pixels)

Effective for salt & pepper noise
Preserves edges better than averaging
```

#### Bilateral Filter
```
output(x,y) = Σ w(x,y,i,j) × input(i,j) / Σ w(x,y,i,j)

Weight = Spatial_Gaussian × Intensity_Gaussian
       = exp(-||p-q||²/2σs²) × exp(-|I(p)-I(q)|²/2σr²)
```

#### Non-Local Means
```
output(x) = Σ w(x,y) × input(y)

Where w(x,y) = exp(-||patch(x) - patch(y)||² / h²)

Compares patches (not just pixels) across entire image
```

---

## 8. Configuration

### 8.1 Backend Configuration

**Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `dev-secret-key` | Flask secret key |
| `FLASK_ENV` | `development` | Environment mode |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `MAX_CONTENT_LENGTH` | `16MB` | Maximum upload size |
| `MAX_IMAGE_DIMENSION` | `4096` | Maximum image dimension |

### 8.2 Frontend Configuration

**Vite Environment Variables (.env):**

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API URL |
| `VITE_API_TIMEOUT` | `30000` | Request timeout (ms) |
| `VITE_MAX_FILE_SIZE` | `16777216` | Max file size (bytes) |

### 8.3 Tailwind Configuration

Custom theme configuration in `tailwind.config.js`:

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f8fafc',
          // ... custom dark theme colors
          950: '#020617'
        }
      }
    }
  }
}
```

---

## 9. Docker Deployment

### 9.1 Docker Compose

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ../backend
      dockerfile: ../docker/Dockerfile.backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=development
      - CORS_ORIGINS=http://localhost:3000
    volumes:
      - ../backend:/app
      - backend-uploads:/app/uploads

  frontend:
    build:
      context: ../frontend
      dockerfile: ../docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5000/api
    depends_on:
      - backend

volumes:
  backend-uploads:
```

### 9.2 Running with Docker

```bash
# Build and start all services
cd docker
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v
```

### 9.3 Production Deployment

```bash
# Use production Dockerfiles
docker-compose -f docker-compose.prod.yml up --build

# Scale backend workers
docker-compose up --scale backend=4
```

---

## 10. Troubleshooting

### 10.1 Common Issues

#### CORS Errors
```
Error: Access-Control-Allow-Origin header missing
```
**Solution:** Ensure `CORS_ORIGINS` in backend matches frontend URL.

#### Image Upload Fails
```
Error: File type not allowed / File too large
```
**Solution:** 
- Check file extension is in `ALLOWED_EXTENSIONS`
- Ensure file size is under `MAX_CONTENT_LENGTH` (16MB default)

#### FFT Computation Slow
**Solution:** 
- Resize large images before FFT computation
- Backend automatically resizes images > 1024px

#### Memory Issues
```
Error: numpy.core._exceptions.MemoryError
```
**Solution:**
- Reduce `MAX_IMAGE_DIMENSION`
- Process images in batches
- Increase Docker memory limits

### 10.2 Debug Mode

**Backend:**
```bash
# Enable Flask debug mode
export FLASK_DEBUG=1
python main.py
```

**Frontend:**
```bash
# View detailed build errors
npm run build -- --debug
```

### 10.3 Logging

**Backend logs:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**API request debugging:**
```javascript
// In api.js
api.interceptors.request.use(config => {
  console.log('Request:', config)
  return config
})
```

---

## 11. Contributing

### 11.1 Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

### 11.2 Code Style

**Python (Backend):**
- Follow PEP 8
- Use type hints
- Document functions with docstrings

**JavaScript (Frontend):**
- Use ESLint configuration
- Prefer functional components
- Use meaningful variable names

### 11.3 Testing

**Backend Tests:**
```bash
cd backend
pytest tests/ -v
pytest tests/ --cov=app  # with coverage
```

**Frontend Tests:**
```bash
cd frontend
npm run lint
npm run test
```

### 11.4 Adding New Features

**New Filter:**
1. Add method to `ImageProcessor` class
2. Register in `AVAILABLE_FILTERS` dictionary
3. Add UI controls in `FilterPanel.jsx`
4. Update documentation

**New Noise Type:**
1. Add method in `ImageProcessor` (`add_*_noise`)
2. Register in `NOISE_TYPES` dictionary
3. Add UI in `NoisePanel.jsx`

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenCV Team for computer vision library
- React Team for the UI framework
- Tailwind CSS for styling utilities
- Framer Motion for animations
- Recharts for visualization components

---

<div align="center">

**Made with ❤️ by the Pixalyze Team**

[Documentation](DOCUMENTATION.md) • [Issues](https://github.com/your-repo/issues) • [Discussions](https://github.com/your-repo/discussions)

</div>

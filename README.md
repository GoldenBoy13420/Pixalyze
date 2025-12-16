# 🎨 ImageFX Studio

<div align="center">

![ImageFX Studio](https://img.shields.io/badge/ImageFX-Studio-gradient?style=for-the-badge&logo=image&logoColor=white)

**A modern, powerful image processing application with React frontend and Flask backend**

[![React](https://img.shields.io/badge/React-18.2-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3-000?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776ab?style=flat-square&logo=python)](https://python.org/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.8-5c3ee8?style=flat-square&logo=opencv)](https://opencv.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

### 🖼️ Image Operations
- **Upload & Preview** - Drag-and-drop with instant preview
- **Format Support** - PNG, JPG, GIF, BMP, TIFF

### 📊 Histogram Analysis
- Real-time histogram visualization
- Global histogram equalization
- CLAHE (Contrast Limited Adaptive Histogram Equalization)
- Contrast stretching

### 🎛️ Spatial Filters
- **Blur**: Gaussian, Box, Median, Bilateral
- **Edge Detection**: Sobel, Laplacian, Canny
- **Enhancement**: Sharpen, Unsharp Mask, Emboss
- **Custom Kernels**: Create your own filters

### 📡 Frequency Domain
- FFT magnitude and phase visualization
- Low-pass, High-pass, Band-pass filters
- Ideal, Gaussian, Butterworth filter types
- Notch filtering for periodic noise

### 🔇 Noise Operations
- **Add Noise**: Gaussian, Salt & Pepper, Poisson, Speckle, Uniform
- **Remove Noise**: Gaussian blur, Median, Bilateral, Non-local means, Wiener

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Using Docker

```bash
cd docker
docker-compose up --build
```

---

## 📁 Project Structure

```
image_processing_gui/
├── backend/                    # Flask API
│   ├── app/
│   │   ├── models/             # ImageProcessor class
│   │   ├── routes/             # API endpoints
│   │   ├── utils/              # Helper functions
│   │   └── middleware/         # CORS, error handling
│   ├── tests/                  # Unit tests
│   ├── main.py                 # Entry point
│   ├── config.py               # Configuration
│   └── requirements.txt
│
├── frontend/                   # React UI
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   ├── store/              # State management
│   │   └── index.css           # Tailwind styles
│   ├── package.json
│   └── vite.config.js
│
└── docker/                     # Docker configuration
    ├── docker-compose.yml
    ├── Dockerfile.backend
    └── Dockerfile.frontend
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/images/upload` | Upload an image |
| GET | `/api/images/<id>` | Get image by ID |
| DELETE | `/api/images/<id>` | Delete image |
| GET | `/api/histogram/<id>` | Get histogram data |
| POST | `/api/histogram/equalize` | Equalize histogram |
| POST | `/api/filters/apply` | Apply spatial filter |
| POST | `/api/fourier/transform` | Compute FFT |
| POST | `/api/fourier/filter` | Apply frequency filter |
| POST | `/api/noise/add` | Add noise to image |
| POST | `/api/noise/remove` | Remove noise from image |

---

## 🎨 Screenshots

### Upload Interface
Beautiful drag-and-drop upload with instant preview

### Histogram Analysis
Interactive histogram visualization with equalization options

### Filter Panel
Organized filter categories with real-time parameter adjustment

### Fourier Transform
Visualize frequency domain with interactive filtering

### Noise Operations
Add and remove various types of noise

---

## 🛠️ Technologies

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Zustand** - State management
- **Axios** - HTTP client

### Backend
- **Flask** - Web framework
- **OpenCV** - Image processing
- **NumPy** - Numerical computing
- **SciPy** - Scientific computing
- **Pillow** - Image I/O
- **Gunicorn** - Production server

---

## 📖 Usage Examples

### Enhance a Photo
1. Upload your image
2. Go to **Histogram** tab
3. Select **CLAHE** equalization
4. Adjust clip limit and tile size
5. Click **Apply**

### Detect Edges
1. Upload your image
2. Go to **Filters** tab
3. Expand **Edge Detection**
4. Choose **Canny Edge**
5. Adjust thresholds
6. Click **Apply**

### Remove Noise
1. Upload noisy image
2. Go to **Noise** tab
3. Switch to **Remove Noise**
4. Select **Non-Local Means**
5. Adjust parameters
6. Click **Apply**

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenCV team for the amazing image processing library
- React and Flask communities
- All contributors and users

---

<div align="center">

**Made with ❤️ for image processing enthusiasts**

[Report Bug](https://github.com/yourusername/imagefx-studio/issues) · [Request Feature](https://github.com/yourusername/imagefx-studio/issues)

</div>

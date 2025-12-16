# Pixalyze Backend

Flask-based REST API for Pixalyze image processing and analysis operations.

## Features

- **Image Upload/Management**: Upload, store, and retrieve images
- **Histogram Operations**: Calculate histograms, perform equalization
- **Filtering**: Apply various spatial filters (blur, sharpen, edge detection)
- **Fourier Transform**: FFT operations, frequency domain filtering
- **Noise Operations**: Add and remove noise from images

## Setup

### Prerequisites

- Python 3.9+
- pip

### Installation

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy environment file:
```bash
cp .env.example .env
```

5. Run the application:
```bash
python main.py
```

The server will start at `http://localhost:5000`.

## API Endpoints

### Images
- `POST /api/images/upload` - Upload an image
- `GET /api/images/<id>` - Get image by ID
- `DELETE /api/images/<id>` - Delete image

### Histogram
- `GET /api/histogram/<id>` - Get histogram data
- `POST /api/histogram/equalize` - Equalize histogram

### Filters
- `POST /api/filters/apply` - Apply filter to image
- `GET /api/filters/available` - List available filters

### Fourier
- `POST /api/fourier/transform` - Compute FFT
- `POST /api/fourier/inverse` - Compute inverse FFT
- `POST /api/fourier/filter` - Apply frequency filter

### Noise
- `POST /api/noise/add` - Add noise to image
- `POST /api/noise/remove` - Remove noise from image

## Testing

```bash
pytest tests/ -v
```

## Production Deployment

Use gunicorn for production:

```bash
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

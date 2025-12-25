# 🔧 Pixalyze API Quick Reference

A condensed reference guide for the Pixalyze REST API.

---

## Base URL

```
Development: http://localhost:5000/api
Production:  https://your-domain.com/api
```

---

## Authentication

Currently, the API does not require authentication.

---

## Response Format

All responses are JSON with the following structure:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "error": "Error message description"
}
```

---

## 📷 Images API

### Upload Image
```http
POST /images/upload
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | Image file (PNG, JPG, GIF, BMP, TIFF) |

**Response:** `201 Created`
```json
{
  "success": true,
  "image_id": "abc123-def456",
  "filename": "photo.jpg",
  "width": 1920,
  "height": 1080,
  "channels": 3
}
```

### Get Image
```http
GET /images/{image_id}
```

**Response:** Image binary data

### Get Image Metadata
```http
GET /images/{image_id}?metadata=true
```

**Response:**
```json
{
  "id": "abc123",
  "filename": "photo.jpg",
  "width": 1920,
  "height": 1080
}
```

### Delete Image
```http
DELETE /images/{image_id}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Image deleted"
}
```

---

## 📊 Histogram API

### Get Histogram
```http
GET /histogram/{image_id}
```

**Response:**
```json
{
  "success": true,
  "histogram": {
    "red": [0, 12, 45, ...],    // 256 values
    "green": [0, 8, 32, ...],
    "blue": [2, 15, 28, ...]
  }
}
```

### Equalize Histogram
```http
POST /histogram/equalize
Content-Type: application/json
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| image_id | string | - | Required |
| method | string | "global" | "global", "clahe", "adaptive" |
| clip_limit | float | 2.0 | CLAHE only |
| tile_size | int | 8 | CLAHE only |

**Response:**
```json
{
  "success": true,
  "result_image": "data:image/png;base64,...",
  "equalized_histogram": { ... }
}
```

### Contrast Stretch
```http
POST /histogram/stretch
Content-Type: application/json
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| image_id | string | - | Required |
| low_percentile | int | 2 | Lower bound |
| high_percentile | int | 98 | Upper bound |

---

## 🎨 Filters API

### Get Available Filters
```http
GET /filters/available
```

### Apply Filter
```http
POST /filters/apply
Content-Type: application/json
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image_id | string | Yes | Image identifier |
| filter_type | string | Yes | Filter name |
| params | object | No | Filter parameters |

**Filter Types & Parameters:**

| Filter | Parameters |
|--------|------------|
| `blur` | `kernel_size`: 3-21, `sigma`: 0.1-10 |
| `box_blur` | `kernel_size`: 3-21 |
| `median` | `kernel_size`: 3-21 (odd) |
| `bilateral` | `d`: 3-21, `sigma_color`: 10-200, `sigma_space`: 10-200 |
| `sharpen` | `strength`: 0.1-3.0 |
| `unsharp_mask` | `sigma`: 0.1-10, `strength`: 0.1-5, `threshold`: 0-50 |
| `edge_sobel` | `ksize`: 3, 5, or 7 |
| `edge_laplacian` | `ksize`: 1, 3, 5, or 7 |
| `edge_canny` | `threshold1`: 0-255, `threshold2`: 0-255 |
| `emboss` | (none) |
| `high_pass` | `kernel_size`: 3-21 |
| `low_pass` | `kernel_size`: 3-21 |
| `custom` | `kernel`: 3x3 float array |

**Example Request:**
```json
{
  "image_id": "abc123",
  "filter_type": "blur",
  "params": {
    "kernel_size": 7,
    "sigma": 2.0
  }
}
```

---

## 📡 Fourier API

### Compute FFT
```http
POST /fourier/transform
Content-Type: application/json
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| image_id | string | - | Required |
| shift | bool | true | Center zero frequency |
| log_scale | bool | true | Log scaling for display |

**Response:**
```json
{
  "success": true,
  "magnitude_spectrum": "data:image/png;base64,...",
  "phase_spectrum": "data:image/png;base64,..."
}
```

### Apply Frequency Filter
```http
POST /fourier/filter
Content-Type: application/json
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| image_id | string | - | Required |
| filter_type | string | "lowpass" | Filter type |
| cutoff | float | 0.3 | Cutoff (0-1) |
| cutoff_high | float | 0.7 | High cutoff (bandpass/bandstop) |
| filter_order | int | 2 | Butterworth order |
| filter_method | string | "gaussian" | Method type |

**Filter Types:** `lowpass`, `highpass`, `bandpass`, `bandstop`, `notch`

**Filter Methods:** `ideal`, `gaussian`, `butterworth`

### Homomorphic Filter
```http
POST /fourier/homomorphic
Content-Type: application/json
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| image_id | string | - | Required |
| gamma_low | float | 0.3 | Low frequency gain |
| gamma_high | float | 1.5 | High frequency gain |
| cutoff | float | 30 | Cutoff frequency |
| c | float | 1 | Sharpness constant |

---

## 🔇 Noise API

### Get Noise Types
```http
GET /noise/types
```

### Get Denoise Methods
```http
GET /noise/denoise-methods
```

### Add Noise
```http
POST /noise/add
Content-Type: application/json
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image_id | string | Yes | Image identifier |
| noise_type | string | Yes | Noise type |
| params | object | No | Noise parameters |

**Noise Types & Parameters:**

| Type | Parameters |
|------|------------|
| `gaussian` | `mean`: -50 to 50, `std`: 1-100 |
| `salt_pepper` | `amount`: 0.01-0.5, `salt_ratio`: 0-1 |
| `poisson` | `scale`: 0.1-5 |
| `speckle` | `std`: 0.01-1 |
| `uniform` | `low`: -100 to 0, `high`: 0-100 |

### Remove Noise
```http
POST /noise/remove
Content-Type: application/json
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image_id | string | Yes | Image identifier |
| method | string | Yes | Denoise method |
| params | object | No | Method parameters |

**Denoise Methods & Parameters:**

| Method | Parameters |
|--------|------------|
| `gaussian` | `kernel_size`: 3-21, `sigma`: 0.1-10 |
| `median` | `kernel_size`: 3-21 (odd) |
| `bilateral` | `d`: 3-21, `sigma_color`: 10-200, `sigma_space`: 10-200 |
| `nlm` | `h`: 1-30, `template_window_size`: 3-21, `search_window_size`: 7-51 |
| `morphological` | `kernel_size`: 3-21, `operation`: "opening"/"closing" |
| `wiener` | `noise_variance`: float or null (auto-estimate) |

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Missing or invalid parameters |
| 404 | Not Found - Image ID not found |
| 413 | Payload Too Large - File exceeds size limit |
| 415 | Unsupported Media Type - Invalid file format |
| 500 | Internal Server Error - Processing failed |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Upload | 10 requests/minute |
| Processing | 30 requests/minute |
| Read | 100 requests/minute |

---

## Examples

### cURL Examples

**Upload Image:**
```bash
curl -X POST http://localhost:5000/api/images/upload \
  -F "file=@photo.jpg"
```

**Apply Gaussian Blur:**
```bash
curl -X POST http://localhost:5000/api/filters/apply \
  -H "Content-Type: application/json" \
  -d '{"image_id": "abc123", "filter_type": "blur", "params": {"kernel_size": 5, "sigma": 1.5}}'
```

**Compute FFT:**
```bash
curl -X POST http://localhost:5000/api/fourier/transform \
  -H "Content-Type: application/json" \
  -d '{"image_id": "abc123"}'
```

### JavaScript/Axios Examples

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
})

// Upload image
const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/images/upload', formData)
  return response.data
}

// Apply filter
const applyFilter = async (imageId, filterType, params) => {
  const response = await api.post('/filters/apply', {
    image_id: imageId,
    filter_type: filterType,
    params
  })
  return response.data
}

// Add noise
const addNoise = async (imageId, noiseType, params) => {
  const response = await api.post('/noise/add', {
    image_id: imageId,
    noise_type: noiseType,
    params
  })
  return response.data
}
```

### Python/Requests Examples

```python
import requests

BASE_URL = 'http://localhost:5000/api'

# Upload image
def upload_image(filepath):
    with open(filepath, 'rb') as f:
        response = requests.post(
            f'{BASE_URL}/images/upload',
            files={'file': f}
        )
    return response.json()

# Apply filter
def apply_filter(image_id, filter_type, params=None):
    response = requests.post(
        f'{BASE_URL}/filters/apply',
        json={
            'image_id': image_id,
            'filter_type': filter_type,
            'params': params or {}
        }
    )
    return response.json()

# Compute histogram
def get_histogram(image_id):
    response = requests.get(f'{BASE_URL}/histogram/{image_id}')
    return response.json()
```

---

## WebSocket Events (Future)

Reserved for real-time processing updates:

| Event | Description |
|-------|-------------|
| `processing:start` | Processing began |
| `processing:progress` | Progress update (%) |
| `processing:complete` | Processing finished |
| `processing:error` | Error occurred |

---

## Changelog

### v1.0.0
- Initial API release
- Image upload/management
- Histogram operations
- Spatial filters
- Fourier transform
- Noise operations

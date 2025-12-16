# Pixalyze Frontend

A beautiful, modern React frontend for the Pixalyze image processing and analysis application.

## Features

- 🎨 **Modern UI** - Glassmorphism design with smooth animations
- 📊 **Histogram Analysis** - Visualize and equalize image histograms
- 🎛️ **Spatial Filters** - Blur, sharpen, edge detection, and more
- 📡 **Fourier Transform** - Frequency domain analysis and filtering
- 🔇 **Noise Operations** - Add and remove various types of noise
- 📱 **Responsive** - Works on desktop and mobile devices

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=16777216
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Layout/          # Layout components (Header, Sidebar)
│   ├── ImageUpload.jsx  # Image upload with drag & drop
│   ├── HistogramPanel.jsx
│   ├── FilterPanel.jsx
│   ├── FourierPanel.jsx
│   ├── NoisePanel.jsx
│   └── ResultsDisplay.jsx
├── pages/               # Page components
│   ├── Home.jsx
│   └── About.jsx
├── services/            # API services
│   └── api.js
├── store/               # State management (Zustand)
│   └── useStore.js
├── App.jsx
├── main.jsx
└── index.css            # Tailwind CSS
```

## Technologies

- React 18 + Vite
- Tailwind CSS
- Framer Motion (animations)
- Recharts (histogram visualization)
- Zustand (state management)
- React Hot Toast (notifications)
- Lucide React (icons)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

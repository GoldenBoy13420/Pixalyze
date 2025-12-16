import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000

const api = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  config => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() }
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.error || error.message || 'An error occurred'
    console.error('API Error:', message)
    return Promise.reject(new Error(message))
  }
)

// Image API
export const imageAPI = {
  upload: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  
  get: async (imageId) => {
    const response = await api.get(`/images/${imageId}`, {
      responseType: 'blob'
    })
    return URL.createObjectURL(response.data)
  },
  
  getMetadata: async (imageId) => {
    const response = await api.get(`/images/${imageId}?metadata=true`)
    return response.data
  },
  
  delete: async (imageId) => {
    const response = await api.delete(`/images/${imageId}`)
    return response.data
  },
  
  list: async () => {
    const response = await api.get('/images/list')
    return response.data
  }
}

// Histogram API
export const histogramAPI = {
  calculate: async (imageId) => {
    const response = await api.get(`/histogram/${imageId}`)
    return response.data
  },
  
  equalize: async (imageId, method = 'global', options = {}) => {
    const response = await api.post('/histogram/equalize', {
      image_id: imageId,
      method,
      ...options
    })
    return response.data
  },
  
  contrastStretch: async (imageId, lowPercentile = 2, highPercentile = 98) => {
    const response = await api.post('/histogram/contrast-stretch', {
      image_id: imageId,
      low_percentile: lowPercentile,
      high_percentile: highPercentile
    })
    return response.data
  }
}

// Filter API
export const filterAPI = {
  getAvailable: async () => {
    const response = await api.get('/filters/available')
    return response.data
  },
  
  apply: async (imageId, filterType, params = {}) => {
    const response = await api.post('/filters/apply', {
      image_id: imageId,
      filter_type: filterType,
      params
    })
    return response.data
  },
  
  applyMultiple: async (imageId, filters) => {
    const response = await api.post('/filters/apply-multiple', {
      image_id: imageId,
      filters
    })
    return response.data
  }
}

// Fourier API
export const fourierAPI = {
  transform: async (imageId, shift = true, logScale = true) => {
    const response = await api.post('/fourier/transform', {
      image_id: imageId,
      shift,
      log_scale: logScale
    })
    return response.data
  },
  
  inverse: async (imageId) => {
    const response = await api.post('/fourier/inverse', {
      image_id: imageId
    })
    return response.data
  },
  
  filter: async (imageId, filterType, options = {}) => {
    const response = await api.post('/fourier/filter', {
      image_id: imageId,
      filter_type: filterType,
      ...options
    })
    return response.data
  }
}

// Noise API
export const noiseAPI = {
  getTypes: async () => {
    const response = await api.get('/noise/types')
    return response.data
  },
  
  getDenoiseMethods: async () => {
    const response = await api.get('/noise/denoise-methods')
    return response.data
  },
  
  add: async (imageId, noiseType, params = {}) => {
    const response = await api.post('/noise/add', {
      image_id: imageId,
      noise_type: noiseType,
      params
    })
    return response.data
  },
  
  remove: async (imageId, method, params = {}) => {
    const response = await api.post('/noise/remove', {
      image_id: imageId,
      method,
      params
    })
    return response.data
  },
  
  analyze: async (imageId) => {
    const response = await api.post('/noise/analyze', {
      image_id: imageId
    })
    return response.data
  }
}

export default api

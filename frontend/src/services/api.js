import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000

// Request cancellation tokens
const pendingRequests = new Map()

const api = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Create a cancellable request key
const getRequestKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.data || {})}`
}

// Request interceptor with cancellation support
api.interceptors.request.use(
  config => {
    // Cancel duplicate requests
    const requestKey = getRequestKey(config)
    if (pendingRequests.has(requestKey)) {
      const controller = pendingRequests.get(requestKey)
      controller.abort()
    }
    
    // Create new abort controller
    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(requestKey, controller)
    
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  response => {
    // Remove from pending requests
    const requestKey = getRequestKey(response.config)
    pendingRequests.delete(requestKey)
    return response
  },
  error => {
    // Don't treat aborted requests as errors
    if (axios.isCancel(error) || error.name === 'AbortError') {
      return Promise.reject({ cancelled: true })
    }
    
    const requestKey = error.config ? getRequestKey(error.config) : null
    if (requestKey) {
      pendingRequests.delete(requestKey)
    }
    
    const message = error.response?.data?.error || error.message || 'An error occurred'
    console.error('API Error:', message)
    return Promise.reject(new Error(message))
  }
)

// Debounce utility
export const debounce = (fn, delay = 300) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        resolve(await fn(...args))
      }, delay)
    })
  }
}

// Simple in-memory cache for API responses
const responseCache = new Map()
const CACHE_TTL = 60000 // 1 minute cache

const getCached = (key) => {
  const cached = responseCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  responseCache.delete(key)
  return null
}

const setCache = (key, data) => {
  // Limit cache size
  if (responseCache.size > 100) {
    const firstKey = responseCache.keys().next().value
    responseCache.delete(firstKey)
  }
  responseCache.set(key, { data, timestamp: Date.now() })
}

// Image API
export const imageAPI = {
  upload: async (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress ? (e) => onProgress(Math.round((e.loaded * 100) / e.total)) : undefined
    })
    return response.data
  },
  
  get: async (imageId) => {
    const cacheKey = `image:${imageId}`
    const cached = getCached(cacheKey)
    if (cached) return cached
    
    const response = await api.get(`/images/${imageId}`, {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(response.data)
    setCache(cacheKey, url)
    return url
  },
  
  getMetadata: async (imageId) => {
    const response = await api.get(`/images/${imageId}?metadata=true`)
    return response.data
  },
  
  delete: async (imageId) => {
    const response = await api.delete(`/images/${imageId}`)
    // Clear related caches
    responseCache.delete(`image:${imageId}`)
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
    const cacheKey = `histogram:${imageId}`
    const cached = getCached(cacheKey)
    if (cached) return cached
    
    const response = await api.get(`/histogram/${imageId}`)
    setCache(cacheKey, response.data)
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

// Filter API with debounced apply
export const filterAPI = {
  getAvailable: async () => {
    const cacheKey = 'filters:available'
    const cached = getCached(cacheKey)
    if (cached) return cached
    
    const response = await api.get('/filters/available')
    setCache(cacheKey, response.data)
    return response.data
  },
  
  apply: async (imageId, filterType, params = {}) => {
    const response = await api.post('/filters/apply', {
      image_id: imageId,
      filter_type: filterType,
      params,
      use_cache: true
    })
    return response.data
  },
  
  // Debounced version for real-time parameter adjustments
  applyDebounced: debounce(async (imageId, filterType, params = {}) => {
    const response = await api.post('/filters/apply', {
      image_id: imageId,
      filter_type: filterType,
      params,
      use_cache: true
    })
    return response.data
  }, 300),
  
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

// Noise API with caching
export const noiseAPI = {
  getTypes: async () => {
    const cacheKey = 'noise:types'
    const cached = getCached(cacheKey)
    if (cached) return cached
    
    const response = await api.get('/noise/types')
    setCache(cacheKey, response.data)
    return response.data
  },
  
  getDenoiseMethods: async () => {
    const cacheKey = 'noise:denoise-methods'
    const cached = getCached(cacheKey)
    if (cached) return cached
    
    const response = await api.get('/noise/denoise-methods')
    setCache(cacheKey, response.data)
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

// Cancel all pending requests
export const cancelAllRequests = () => {
  pendingRequests.forEach((controller) => {
    controller.abort()
  })
  pendingRequests.clear()
}

// Clear API cache
export const clearCache = () => {
  responseCache.clear()
}

export default api

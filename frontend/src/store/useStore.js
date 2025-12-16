import { create } from 'zustand'
import { imageAPI, histogramAPI, filterAPI, fourierAPI, noiseAPI, cancelAllRequests, clearCache } from '../services/api'
import toast from 'react-hot-toast'

const useStore = create((set, get) => ({
  // State
  currentImage: null,
  processedImage: null,
  imageHistory: [],
  histogram: null,
  fftData: null,
  isLoading: false,
  activeTab: 'upload',
  filters: null,
  noiseTypes: null,
  denoiseMethods: null,
  comparisonMode: false,
  
  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setComparisonMode: (mode) => set({ comparisonMode: mode }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Reset state and cancel pending requests
  resetState: () => {
    cancelAllRequests()
    clearCache()
    set({
      currentImage: null,
      processedImage: null,
      imageHistory: [],
      histogram: null,
      fftData: null,
      isLoading: false
    })
  },
  
  // Image actions with optimized upload
  uploadImage: async (file, onProgress) => {
    // Cancel any pending requests first
    cancelAllRequests()
    
    set({ isLoading: true })
    try {
      const result = await imageAPI.upload(file, onProgress)
      const imageUrl = await imageAPI.get(result.image_id)
      
      const imageData = {
        id: result.image_id,
        filename: result.filename,
        url: imageUrl,
        width: result.width,
        height: result.height,
        channels: result.channels
      }
      
      set({ 
        currentImage: imageData,
        processedImage: null,
        histogram: null,
        fftData: null,
        imageHistory: [],
        activeTab: 'histogram'
      })
      
      toast.success(`Uploaded: ${result.filename}`)
      return imageData
    } catch (error) {
      toast.error(error.message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
  clearImage: () => {
    set({
      currentImage: null,
      processedImage: null,
      histogram: null,
      fftData: null,
      imageHistory: [],
      activeTab: 'upload'
    })
  },
  
  // Add processed image to history
  addToHistory: (imageData, operation) => {
    const history = get().imageHistory
    set({
      imageHistory: [...history, { ...imageData, operation, timestamp: Date.now() }]
    })
  },
  
  undoLastOperation: () => {
    const history = get().imageHistory
    if (history.length > 0) {
      const newHistory = history.slice(0, -1)
      const lastImage = newHistory[newHistory.length - 1]
      set({
        processedImage: lastImage || null,
        imageHistory: newHistory
      })
      toast.success('Undone last operation')
    }
  },
  
  // Histogram actions
  calculateHistogram: async () => {
    const { currentImage } = get()
    if (!currentImage) return
    
    set({ isLoading: true })
    try {
      const result = await histogramAPI.calculate(currentImage.id)
      set({ histogram: result.histogram })
      return result.histogram
    } catch (error) {
      toast.error(error.message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
  equalizeHistogram: async (method = 'global', options = {}) => {
    const { currentImage, addToHistory } = get()
    if (!currentImage) return
    
    set({ isLoading: true })
    try {
      const result = await histogramAPI.equalize(currentImage.id, method, options)
      
      const processedData = {
        url: result.result_image,
        histogram: result.equalized_histogram
      }
      
      set({ 
        processedImage: processedData,
        histogram: result.equalized_histogram
      })
      
      addToHistory(processedData, `Histogram ${method} equalization`)
      toast.success('Histogram equalized!')
      return result
    } catch (error) {
      toast.error(error.message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
  // Filter actions
  loadFilters: async () => {
    try {
      const result = await filterAPI.getAvailable()
      set({ filters: result.filters })
      return result.filters
    } catch (error) {
      console.error('Failed to load filters:', error)
    }
  },
  
  applyFilter: async (filterType, params = {}) => {
    const { currentImage, addToHistory } = get()
    if (!currentImage) return
    
    set({ isLoading: true })
    try {
      const result = await filterAPI.apply(currentImage.id, filterType, params)
      
      // Skip update if request was cancelled
      if (result.cancelled) return
      
      const processedData = {
        url: result.result_image,
        filterType,
        params,
        cached: result.cached
      }
      
      set({ processedImage: processedData })
      addToHistory(processedData, `Filter: ${filterType}`)
      
      // Show different message if result was cached
      if (result.cached) {
        toast.success(`Applied ${filterType} filter (cached)`)
      } else {
        toast.success(`Applied ${filterType} filter`)
      }
      return result
    } catch (error) {
      if (!error.cancelled) {
        toast.error(error.message)
        throw error
      }
    } finally {
      set({ isLoading: false })
    }
  },
  
  // Fourier actions
  computeFFT: async () => {
    const { currentImage } = get()
    if (!currentImage) return
    
    set({ isLoading: true })
    try {
      const result = await fourierAPI.transform(currentImage.id)
      set({ 
        fftData: {
          magnitude: result.magnitude_spectrum,
          phase: result.phase_spectrum
        }
      })
      toast.success('FFT computed!')
      return result
    } catch (error) {
      toast.error(error.message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
  applyFrequencyFilter: async (filterType, options = {}) => {
    const { currentImage, addToHistory } = get()
    if (!currentImage) return
    
    set({ isLoading: true })
    try {
      const result = await fourierAPI.filter(currentImage.id, filterType, options)
      
      const processedData = {
        url: result.result_image,
        filterMask: result.filter_mask,
        filterType
      }
      
      set({ processedImage: processedData })
      addToHistory(processedData, `Frequency filter: ${filterType}`)
      toast.success(`Applied ${filterType} frequency filter`)
      return result
    } catch (error) {
      toast.error(error.message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
  // Noise actions
  loadNoiseTypes: async () => {
    try {
      const [noiseResult, denoiseResult] = await Promise.all([
        noiseAPI.getTypes(),
        noiseAPI.getDenoiseMethods()
      ])
      set({ 
        noiseTypes: noiseResult.noise_types,
        denoiseMethods: denoiseResult.denoise_methods
      })
    } catch (error) {
      console.error('Failed to load noise types:', error)
    }
  },
  
  addNoise: async (noiseType, params = {}) => {
    const { currentImage, addToHistory } = get()
    if (!currentImage) return
    
    set({ isLoading: true })
    try {
      const result = await noiseAPI.add(currentImage.id, noiseType, params)
      
      const processedData = {
        url: result.result_image,
        noiseType,
        params
      }
      
      set({ processedImage: processedData })
      addToHistory(processedData, `Added ${noiseType} noise`)
      toast.success(`Added ${noiseType} noise`)
      return result
    } catch (error) {
      toast.error(error.message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
  removeNoise: async (method, params = {}) => {
    const { currentImage, addToHistory } = get()
    if (!currentImage) return
    
    set({ isLoading: true })
    try {
      const result = await noiseAPI.remove(currentImage.id, method, params)
      
      const processedData = {
        url: result.result_image,
        method,
        params
      }
      
      set({ processedImage: processedData })
      addToHistory(processedData, `Noise removal: ${method}`)
      toast.success(`Applied ${method} denoising`)
      return result
    } catch (error) {
      toast.error(error.message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
  // Download processed image
  downloadImage: () => {
    const { processedImage, currentImage } = get()
    const imageToDownload = processedImage?.url || currentImage?.url
    
    if (!imageToDownload) {
      toast.error('No image to download')
      return
    }
    
    const link = document.createElement('a')
    link.href = imageToDownload
    link.download = `processed_${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Image downloaded!')
  }
}))

export default useStore

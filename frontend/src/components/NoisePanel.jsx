import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Sparkles, AlertTriangle } from 'lucide-react'
import useStore from '../store/useStore'

const noiseTypeInfo = {
  gaussian: { icon: '📊', color: 'from-blue-500 to-cyan-500', desc: 'Normal distribution noise' },
  salt_pepper: { icon: '🧂', color: 'from-gray-400 to-gray-600', desc: 'Random black and white pixels' },
  poisson: { icon: '🎲', color: 'from-purple-500 to-indigo-500', desc: 'Photon counting noise' },
  speckle: { icon: '✨', color: 'from-yellow-500 to-orange-500', desc: 'Multiplicative noise' },
  uniform: { icon: '📏', color: 'from-green-500 to-emerald-500', desc: 'Uniform distribution noise' }
}

const denoiseMethodInfo = {
  gaussian: { icon: '🌫️', color: 'from-blue-500 to-cyan-500', desc: 'Gaussian blur smoothing' },
  median: { icon: '🎯', color: 'from-green-500 to-emerald-500', desc: 'Best for salt & pepper' },
  bilateral: { icon: '🔮', color: 'from-purple-500 to-violet-500', desc: 'Edge-preserving smooth' },
  nlm: { icon: '🧠', color: 'from-pink-500 to-rose-500', desc: 'Non-local means denoising' },
  morphological: { icon: '🔲', color: 'from-gray-500 to-slate-500', desc: 'Shape-based filtering' },
  wiener: { icon: '📡', color: 'from-yellow-500 to-amber-500', desc: 'Optimal linear filter' }
}

export default function NoisePanel() {
  const { 
    addNoise, 
    removeNoise, 
    loadNoiseTypes, 
    noiseTypes, 
    denoiseMethods,
    isLoading 
  } = useStore()
  
  const [mode, setMode] = useState('add') // 'add' or 'remove'
  const [selectedNoise, setSelectedNoise] = useState('gaussian')
  const [selectedDenoise, setSelectedDenoise] = useState('gaussian')
  const [noiseParams, setNoiseParams] = useState({ mean: 0, std: 25 })
  const [denoiseParams, setDenoiseParams] = useState({ kernel_size: 5, sigma: 1.0 })
  
  useEffect(() => {
    loadNoiseTypes()
  }, [loadNoiseTypes])
  
  // Update params when noise type changes
  useEffect(() => {
    const defaults = {
      gaussian: { mean: 0, std: 25 },
      salt_pepper: { amount: 0.05, salt_ratio: 0.5 },
      poisson: { scale: 1.0 },
      speckle: { std: 0.1 },
      uniform: { low: -50, high: 50 }
    }
    setNoiseParams(defaults[selectedNoise] || {})
  }, [selectedNoise])
  
  // Update params when denoise method changes
  useEffect(() => {
    const defaults = {
      gaussian: { kernel_size: 5, sigma: 1.0 },
      median: { kernel_size: 5 },
      bilateral: { d: 9, sigma_color: 75, sigma_space: 75 },
      nlm: { h: 10, template_window_size: 7, search_window_size: 21 },
      morphological: { kernel_size: 5, operation: 'opening' },
      wiener: { noise_variance: null }
    }
    setDenoiseParams(defaults[selectedDenoise] || {})
  }, [selectedDenoise])
  
  const handleAddNoise = () => {
    addNoise(selectedNoise, noiseParams)
  }
  
  const handleRemoveNoise = () => {
    removeNoise(selectedDenoise, denoiseParams)
  }
  
  const renderParamSlider = (params, setParams, key, config) => {
    const value = params[key]
    if (typeof value !== 'number') return null
    
    return (
      <div key={key}>
        <label className="flex justify-between text-sm text-dark-400 mb-2">
          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
          <span className="text-pink-400 font-mono">{value}</span>
        </label>
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={(e) => setParams(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
          className="slider"
        />
      </div>
    )
  }
  
  const noiseParamConfigs = {
    mean: { min: -50, max: 50, step: 1 },
    std: { min: 1, max: 100, step: 1 },
    amount: { min: 0.01, max: 0.5, step: 0.01 },
    salt_ratio: { min: 0, max: 1, step: 0.1 },
    scale: { min: 0.1, max: 5, step: 0.1 },
    low: { min: -100, max: 0, step: 5 },
    high: { min: 0, max: 100, step: 5 }
  }
  
  const denoiseParamConfigs = {
    kernel_size: { min: 3, max: 21, step: 2 },
    sigma: { min: 0.1, max: 10, step: 0.1 },
    d: { min: 3, max: 21, step: 2 },
    sigma_color: { min: 10, max: 200, step: 5 },
    sigma_space: { min: 10, max: 200, step: 5 },
    h: { min: 1, max: 30, step: 1 },
    template_window_size: { min: 3, max: 21, step: 2 },
    search_window_size: { min: 7, max: 51, step: 2 }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 
                        flex items-center justify-center shadow-lg">
          <Volume2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Noise Operations</h2>
          <p className="text-dark-400 text-sm">Add and remove image noise</p>
        </div>
      </div>
      
      {/* Mode Toggle */}
      <div className="flex bg-dark-900/50 rounded-xl p-1 border border-dark-800">
        <button
          onClick={() => setMode('add')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all
            ${mode === 'add' 
              ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300' 
              : 'text-dark-400 hover:text-dark-200'
            }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Add Noise
        </button>
        <button
          onClick={() => setMode('remove')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all
            ${mode === 'remove' 
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300' 
              : 'text-dark-400 hover:text-dark-200'
            }`}
        >
          <VolumeX className="w-4 h-4" />
          Remove Noise
        </button>
      </div>
      
      <AnimatePresence mode="wait">
        {mode === 'add' ? (
          <motion.div
            key="add"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Noise Types */}
            <div className="card">
              <h3 className="font-medium text-dark-200 mb-4">Noise Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(noiseTypeInfo).map(([id, info]) => (
                  <motion.button
                    key={id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedNoise(id)}
                    className={`p-3 rounded-xl text-center transition-all
                      ${selectedNoise === id 
                        ? `bg-gradient-to-br ${info.color} text-white shadow-lg` 
                        : 'bg-dark-900/50 border border-dark-800 hover:border-dark-700'
                      }`}
                  >
                    <div className="text-2xl mb-1">{info.icon}</div>
                    <span className={`text-xs font-medium capitalize ${selectedNoise === id ? 'text-white' : 'text-dark-300'}`}>
                      {id.replace(/_/g, ' ')}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Noise Parameters */}
            <div className="card">
              <h3 className="font-medium text-dark-200 mb-4">Parameters</h3>
              <div className="space-y-4">
                {Object.entries(noiseParams).map(([key, value]) => 
                  noiseParamConfigs[key] && renderParamSlider(noiseParams, setNoiseParams, key, noiseParamConfigs[key])
                )}
              </div>
              
              <button
                onClick={handleAddNoise}
                disabled={isLoading}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                {isLoading ? 'Processing...' : 'Add Noise'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="remove"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Denoise Methods */}
            <div className="card">
              <h3 className="font-medium text-dark-200 mb-4">Denoising Method</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(denoiseMethodInfo).map(([id, info]) => (
                  <motion.button
                    key={id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDenoise(id)}
                    className={`p-3 rounded-xl transition-all
                      ${selectedDenoise === id 
                        ? `bg-gradient-to-br ${info.color} text-white shadow-lg` 
                        : 'bg-dark-900/50 border border-dark-800 hover:border-dark-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.icon}</span>
                      <div className="text-left">
                        <div className={`text-sm font-medium capitalize ${selectedDenoise === id ? 'text-white' : 'text-dark-300'}`}>
                          {id === 'nlm' ? 'NL Means' : id.replace(/_/g, ' ')}
                        </div>
                        <div className={`text-xs ${selectedDenoise === id ? 'text-white/70' : 'text-dark-500'}`}>
                          {info.desc}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Denoise Parameters */}
            <div className="card">
              <h3 className="font-medium text-dark-200 mb-4">Parameters</h3>
              <div className="space-y-4">
                {Object.entries(denoiseParams).map(([key, value]) => 
                  denoiseParamConfigs[key] && renderParamSlider(denoiseParams, setDenoiseParams, key, denoiseParamConfigs[key])
                )}
              </div>
              
              <button
                onClick={handleRemoveNoise}
                disabled={isLoading}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isLoading ? 'Processing...' : 'Remove Noise'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

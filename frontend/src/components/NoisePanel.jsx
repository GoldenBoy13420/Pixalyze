import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Sparkles, AlertTriangle, Info } from 'lucide-react'
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

// Noise and denoising explanations
const noiseExplanations = {
  gaussian: {
    title: 'Gaussian Noise',
    description: 'Adds random values from a normal (bell-curve) distribution. Most common noise type in images, caused by sensor limitations and electronic interference.',
    useCase: 'Simulates sensor noise in cameras, useful for testing denoising algorithms.',
    formula: 'p(x) = (1/√2πσ²) × e^(-(x-μ)²/2σ²)'
  },
  salt_pepper: {
    title: 'Salt & Pepper Noise',
    description: 'Randomly sets pixels to either maximum (white/salt) or minimum (black/pepper) intensity values. Creates a scattered dot pattern.',
    useCase: 'Simulates transmission errors, dead pixels, or dust on lens. Best removed with median filter.',
    formula: 'P(salt) + P(pepper) = amount'
  },
  poisson: {
    title: 'Poisson Noise',
    description: 'Also called "shot noise", it follows a Poisson distribution. Intensity-dependent: brighter areas have more noise variance.',
    useCase: 'Models photon counting in low-light imaging, X-ray, and medical imaging.',
    formula: 'P(k) = (λᵏe^(-λ))/k!'
  },
  speckle: {
    title: 'Speckle Noise',
    description: 'Multiplicative noise where the noise intensity scales with pixel values. Common in coherent imaging systems.',
    useCase: 'Found in radar, SAR imagery, and ultrasound. Harder to remove than additive noise.',
    formula: 'Output = Input × (1 + Noise)'
  },
  uniform: {
    title: 'Uniform Noise',
    description: 'Adds random values uniformly distributed within a specified range. All values in range are equally likely.',
    useCase: 'General-purpose noise for testing. Less common in real-world scenarios.',
    formula: 'p(x) = 1/(b-a) for a ≤ x ≤ b'
  }
}

const denoiseExplanations = {
  gaussian: {
    title: 'Gaussian Blur Denoising',
    description: 'Applies weighted averaging based on Gaussian distribution. Simple and fast but blurs edges along with noise.',
    useCase: 'Quick noise reduction when edge preservation is not critical.',
    bestFor: 'Gaussian noise, general smoothing'
  },
  median: {
    title: 'Median Filter Denoising',
    description: 'Replaces each pixel with the median of its neighborhood. Excellent at removing impulse noise while preserving edges.',
    useCase: 'Primary choice for salt & pepper noise. Does not blur edges like linear filters.',
    bestFor: 'Salt & pepper noise, impulse noise'
  },
  bilateral: {
    title: 'Bilateral Filter Denoising',
    description: 'Combines spatial and intensity domain filtering. Smooths similar regions while preserving sharp edges.',
    useCase: 'Photo enhancement, skin smoothing in portraits while keeping details.',
    bestFor: 'General denoising with edge preservation'
  },
  nlm: {
    title: 'Non-Local Means (NLM)',
    description: 'Compares patches across the entire image to find similar regions. Averages pixels based on patch similarity, not just proximity.',
    useCase: 'High-quality denoising that preserves textures and fine details. Computationally intensive.',
    bestFor: 'High-quality denoising, texture preservation'
  },
  morphological: {
    title: 'Morphological Denoising',
    description: 'Uses shape-based operations (erosion, dilation, opening, closing) to remove noise based on structural elements.',
    useCase: 'Binary images, removing small spots or filling holes.',
    bestFor: 'Binary images, structured noise patterns'
  },
  wiener: {
    title: 'Wiener Filter Denoising',
    description: 'Optimal linear filter that minimizes mean square error. Requires knowledge of noise characteristics.',
    useCase: 'When noise statistics are known. Used in signal processing and restoration.',
    bestFor: 'Known noise statistics, signal restoration'
  }
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
  const [showExplanation, setShowExplanation] = useState(true)
  
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

  const currentNoiseExplanation = noiseExplanations[selectedNoise]
  const currentDenoiseExplanation = denoiseExplanations[selectedDenoise]
  
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

            {/* Noise Explanation */}
            {currentNoiseExplanation && (
              <motion.div
                key={selectedNoise + '-explanation'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card bg-gradient-to-br from-pink-500/5 to-rose-500/5 border-pink-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-pink-400" />
                    <h4 className="font-medium text-pink-300">{currentNoiseExplanation.title}</h4>
                  </div>
                  <button 
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-xs text-dark-400 hover:text-pink-300 transition-colors px-2 py-1 rounded-lg hover:bg-dark-800/50"
                  >
                    {showExplanation ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <p className="text-dark-300 text-sm">{currentNoiseExplanation.description}</p>
                      
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-emerald-400">💡</span>
                        <span className="text-dark-400">{currentNoiseExplanation.useCase}</span>
                      </div>
                      
                      {currentNoiseExplanation.formula && (
                        <div className="bg-dark-900/50 rounded-lg p-3">
                          <p className="text-xs text-dark-500 mb-1">Formula:</p>
                          <code className="text-pink-300 text-sm font-mono">{currentNoiseExplanation.formula}</code>
                        </div>
                      )}

                      {/* Visual Diagram */}
                      <div className="bg-dark-900/50 rounded-lg p-3">
                        <p className="text-xs text-dark-500 mb-2">Distribution Pattern:</p>
                        <NoisePatternDiagram noise={selectedNoise} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
            
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

            {/* Denoise Explanation */}
            {currentDenoiseExplanation && (
              <motion.div
                key={selectedDenoise + '-explanation'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-medium text-emerald-300">{currentDenoiseExplanation.title}</h4>
                  </div>
                  <button 
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-xs text-dark-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded-lg hover:bg-dark-800/50"
                  >
                    {showExplanation ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <p className="text-dark-300 text-sm">{currentDenoiseExplanation.description}</p>
                      
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-emerald-400">💡</span>
                        <span className="text-dark-400">{currentDenoiseExplanation.useCase}</span>
                      </div>
                      
                      <div className="bg-dark-900/50 rounded-lg p-3">
                        <p className="text-xs text-dark-500 mb-1">Best for:</p>
                        <span className="text-emerald-300 text-sm">{currentDenoiseExplanation.bestFor}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
            
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

// Noise Pattern Visualization Component
function NoisePatternDiagram({ noise }) {
  return (
    <svg viewBox="0 0 200 60" className="w-full h-16">
      {noise === 'gaussian' && (
        <>
          {/* Gaussian bell curve */}
          <path
            d="M 20 50 Q 50 50 70 40 Q 100 10 130 40 Q 150 50 180 50"
            fill="none"
            stroke="url(#gaussGrad)"
            strokeWidth="2"
          />
          <defs>
            <linearGradient id="gaussGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3"/>
            </linearGradient>
          </defs>
          <text x="100" y="55" textAnchor="middle" fill="#94a3b8" fontSize="8">Normal Distribution (Bell Curve)</text>
          <line x1="100" y1="8" x2="100" y2="50" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2,2"/>
          <text x="100" y="7" textAnchor="middle" fill="#8b5cf6" fontSize="7">μ</text>
        </>
      )}
      
      {noise === 'salt_pepper' && (
        <>
          {/* Salt and pepper pattern */}
          {[...Array(30)].map((_, i) => {
            const x = 25 + Math.random() * 150
            const y = 10 + Math.random() * 35
            const isSalt = Math.random() > 0.5
            return (
              <circle 
                key={i} 
                cx={x} 
                cy={y} 
                r="3" 
                fill={isSalt ? '#fff' : '#1e293b'}
                stroke={isSalt ? '#94a3b8' : '#475569'}
                strokeWidth="0.5"
              />
            )
          })}
          <text x="50" y="55" fill="#fff" fontSize="8">● Salt (white)</text>
          <text x="130" y="55" fill="#475569" fontSize="8">● Pepper (black)</text>
        </>
      )}
      
      {noise === 'poisson' && (
        <>
          {/* Poisson distribution - intensity dependent */}
          <rect x="20" y="10" width="40" height="35" fill="#3b82f6" opacity="0.1" rx="2"/>
          <rect x="70" y="10" width="40" height="35" fill="#3b82f6" opacity="0.3" rx="2"/>
          <rect x="120" y="10" width="40" height="35" fill="#3b82f6" opacity="0.5" rx="2"/>
          {/* Noise dots scaling with intensity */}
          {[...Array(5)].map((_, i) => <circle key={`a${i}`} cx={25 + Math.random()*30} cy={15 + Math.random()*25} r="1.5" fill="#8b5cf6"/>)}
          {[...Array(10)].map((_, i) => <circle key={`b${i}`} cx={75 + Math.random()*30} cy={15 + Math.random()*25} r="1.5" fill="#8b5cf6"/>)}
          {[...Array(20)].map((_, i) => <circle key={`c${i}`} cx={125 + Math.random()*30} cy={15 + Math.random()*25} r="1.5" fill="#8b5cf6"/>)}
          <text x="100" y="55" textAnchor="middle" fill="#94a3b8" fontSize="8">More noise in brighter areas</text>
        </>
      )}
      
      {noise === 'speckle' && (
        <>
          {/* Multiplicative noise pattern */}
          <rect x="20" y="10" width="160" height="35" fill="url(#speckleGrad)" rx="4"/>
          <defs>
            <linearGradient id="speckleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b"/>
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5"/>
            </linearGradient>
          </defs>
          {[...Array(40)].map((_, i) => {
            const x = 25 + i * 4
            const intensity = (x - 20) / 160
            return (
              <circle 
                key={i} 
                cx={x} 
                cy={27 + (Math.random() - 0.5) * 20 * intensity} 
                r={1 + Math.random() * 2 * intensity} 
                fill="#f59e0b"
                opacity={0.3 + intensity * 0.5}
              />
            )
          })}
          <text x="100" y="55" textAnchor="middle" fill="#94a3b8" fontSize="8">Noise scales with pixel intensity</text>
        </>
      )}
      
      {noise === 'uniform' && (
        <>
          {/* Uniform distribution - flat line */}
          <line x1="40" y1="30" x2="160" y2="30" stroke="#22c55e" strokeWidth="2"/>
          <line x1="40" y1="15" x2="40" y2="45" stroke="#22c55e" strokeWidth="1"/>
          <line x1="160" y1="15" x2="160" y2="45" stroke="#22c55e" strokeWidth="1"/>
          <text x="40" y="55" textAnchor="middle" fill="#94a3b8" fontSize="7">Low</text>
          <text x="160" y="55" textAnchor="middle" fill="#94a3b8" fontSize="7">High</text>
          <text x="100" y="25" textAnchor="middle" fill="#22c55e" fontSize="8">Equal probability</text>
        </>
      )}
    </svg>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Waves, Target, CircleDot, Info } from 'lucide-react'
import useStore from '../store/useStore'

const frequencyFilters = [
  { id: 'lowpass', name: 'Low Pass', desc: 'Remove high frequencies (blur)', icon: '🌊', color: 'from-blue-500 to-cyan-500' },
  { id: 'highpass', name: 'High Pass', desc: 'Remove low frequencies (sharpen)', icon: '⚡', color: 'from-yellow-500 to-orange-500' },
  { id: 'bandpass', name: 'Band Pass', desc: 'Keep specific frequency range', icon: '🎯', color: 'from-green-500 to-emerald-500' },
  { id: 'bandstop', name: 'Band Stop', desc: 'Remove specific frequency range', icon: '🚫', color: 'from-red-500 to-rose-500' },
  { id: 'notch', name: 'Notch', desc: 'Remove periodic noise', icon: '🔇', color: 'from-purple-500 to-violet-500' }
]

const filterMethods = [
  { id: 'ideal', name: 'Ideal', desc: 'Sharp cutoff' },
  { id: 'gaussian', name: 'Gaussian', desc: 'Smooth transition' },
  { id: 'butterworth', name: 'Butterworth', desc: 'Controlled rolloff' }
]

// Explanations for FFT concepts
const fftExplanations = {
  general: {
    title: 'Fourier Transform (FFT)',
    description: 'Transforms an image from spatial domain (pixels) to frequency domain (sinusoidal components). Low frequencies represent smooth areas, high frequencies represent edges and details.',
    useCase: 'Essential for frequency-based filtering, noise removal, and analyzing periodic patterns.'
  },
  lowpass: {
    title: 'Low Pass Filter',
    description: 'Allows low frequencies to pass while blocking high frequencies. This removes fine details, edges, and noise, resulting in a blurred/smoothed image.',
    useCase: 'Use for noise reduction and creating soft, dreamy effects.',
    formula: 'H(u,v) = 1 if D(u,v) ≤ D₀, else 0'
  },
  highpass: {
    title: 'High Pass Filter', 
    description: 'Allows high frequencies to pass while blocking low frequencies. This removes smooth areas and keeps only edges and fine details.',
    useCase: 'Use for edge detection, sharpening, and extracting fine details.',
    formula: 'H(u,v) = 0 if D(u,v) ≤ D₀, else 1'
  },
  bandpass: {
    title: 'Band Pass Filter',
    description: 'Allows only a specific range of frequencies to pass. Blocks both very low and very high frequencies, keeping only the mid-range.',
    useCase: 'Use for isolating specific frequency components or texture analysis.',
    formula: 'H(u,v) = 1 if D₁ ≤ D(u,v) ≤ D₂'
  },
  bandstop: {
    title: 'Band Stop (Notch) Filter',
    description: 'Blocks a specific range of frequencies while allowing others to pass. The opposite of band pass filter.',
    useCase: 'Use for removing specific periodic noise or interference patterns.',
    formula: 'H(u,v) = 0 if D₁ ≤ D(u,v) ≤ D₂'
  },
  notch: {
    title: 'Notch Filter',
    description: 'Removes specific frequency components at particular locations in the frequency spectrum. Targets narrow frequency bands.',
    useCase: 'Ideal for removing periodic noise like scan lines, moiré patterns, or electrical interference.',
    formula: 'H(u,v) = 0 at specific (u₀,v₀) points'
  },
  ideal: {
    title: 'Ideal Filter',
    description: 'Has a sharp cutoff - frequencies below/above cutoff are completely passed/blocked. Simple but causes ringing artifacts.',
    characteristic: 'Sharp transition, ringing artifacts'
  },
  gaussian: {
    title: 'Gaussian Filter',
    description: 'Smooth, gradual transition based on Gaussian function. No ringing artifacts but slower rolloff.',
    characteristic: 'Smooth transition, no ringing'
  },
  butterworth: {
    title: 'Butterworth Filter',
    description: 'Controllable rolloff rate via filter order. Higher order = sharper cutoff. Good balance between ideal and Gaussian.',
    characteristic: 'Adjustable sharpness via order parameter'
  }
}

export default function FourierPanel() {
  const { 
    computeFFT, 
    applyFrequencyFilter, 
    fftData, 
    isLoading 
  } = useStore()
  
  const [selectedFilter, setSelectedFilter] = useState('lowpass')
  const [filterMethod, setFilterMethod] = useState('gaussian')
  const [cutoff, setCutoff] = useState(0.3)
  const [cutoffHigh, setCutoffHigh] = useState(0.7)
  const [filterOrder, setFilterOrder] = useState(2)
  const [showFFT, setShowFFT] = useState(false)
  const [showExplanation, setShowExplanation] = useState(true)
  
  const handleComputeFFT = async () => {
    await computeFFT()
    setShowFFT(true)
  }
  
  const handleApplyFilter = () => {
    const options = {
      cutoff,
      filter_method: filterMethod,
      filter_order: filterOrder
    }
    
    if (['bandpass', 'bandstop'].includes(selectedFilter)) {
      options.cutoff_high = cutoffHigh
    }
    
    applyFrequencyFilter(selectedFilter, options)
  }
  
  const needsHighCutoff = ['bandpass', 'bandstop'].includes(selectedFilter)
  const selectedFilterData = frequencyFilters.find(f => f.id === selectedFilter)
  const currentExplanation = fftExplanations[selectedFilter]
  const methodExplanation = fftExplanations[filterMethod]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 
                        flex items-center justify-center shadow-lg">
          <Radio className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Fourier Transform</h2>
          <p className="text-dark-400 text-sm">Frequency domain analysis & filtering</p>
        </div>
      </div>
      
      {/* FFT Visualization */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-dark-200 flex items-center gap-2">
            <Waves className="w-4 h-4 text-orange-400" />
            Frequency Spectrum
          </h3>
          <button
            onClick={handleComputeFFT}
            disabled={isLoading}
            className="btn-secondary py-2"
          >
            {isLoading ? 'Computing...' : 'Compute FFT'}
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          {fftData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <p className="text-sm text-dark-400 text-center">Magnitude Spectrum</p>
                <img 
                  src={fftData.magnitude} 
                  alt="FFT Magnitude" 
                  className="w-full aspect-square object-contain rounded-xl bg-dark-950"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-dark-400 text-center">Phase Spectrum</p>
                <img 
                  src={fftData.phase} 
                  alt="FFT Phase" 
                  className="w-full aspect-square object-contain rounded-xl bg-dark-950"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-48 flex flex-col items-center justify-center text-dark-500"
            >
              <div className="w-16 h-16 rounded-full bg-dark-800/50 flex items-center justify-center mb-4">
                <Radio className="w-8 h-8" />
              </div>
              <p>Click "Compute FFT" to visualize frequency content</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Frequency Filters */}
      <div className="card">
        <h3 className="font-medium text-dark-200 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-400" />
          Frequency Domain Filters
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {frequencyFilters.map((filter) => (
            <motion.button
              key={filter.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedFilter(filter.id)}
              className={`p-3 rounded-xl text-center transition-all
                ${selectedFilter === filter.id 
                  ? `bg-gradient-to-br ${filter.color} text-white shadow-lg` 
                  : 'bg-dark-900/50 border border-dark-800 hover:border-dark-700'
                }`}
            >
              <div className="text-2xl mb-1">{filter.icon}</div>
              <span className={`text-sm font-medium ${selectedFilter === filter.id ? 'text-white' : 'text-dark-300'}`}>
                {filter.name}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Filter Explanation */}
        {currentExplanation && (
          <motion.div
            key={selectedFilter + '-explanation'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-orange-400" />
                <h4 className="font-medium text-orange-300">{currentExplanation.title}</h4>
              </div>
              <button 
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-xs text-dark-400 hover:text-orange-300 transition-colors px-2 py-1 rounded-lg hover:bg-dark-800/50"
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
                  <p className="text-dark-300 text-sm">{currentExplanation.description}</p>
                  
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-400">💡</span>
                    <span className="text-dark-400">{currentExplanation.useCase}</span>
                  </div>
                  
                  {currentExplanation.formula && (
                    <div className="bg-dark-900/50 rounded-lg p-3">
                      <p className="text-xs text-dark-500 mb-1">Formula:</p>
                      <code className="text-orange-300 text-sm font-mono">{currentExplanation.formula}</code>
                    </div>
                  )}
                  
                  {/* Frequency Response Diagram */}
                  <div className="bg-dark-900/50 rounded-lg p-3">
                    <p className="text-xs text-dark-500 mb-2">Frequency Response:</p>
                    <FrequencyFilterDiagram filter={selectedFilter} cutoff={cutoff} cutoffHigh={cutoffHigh} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        
        {/* Filter Method */}
        <div className="mb-6">
          <p className="text-sm text-dark-400 mb-3">Filter Method</p>
          <div className="flex gap-2">
            {filterMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setFilterMethod(method.id)}
                className={`flex-1 p-3 rounded-xl text-sm transition-all
                  ${filterMethod === method.id 
                    ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300' 
                    : 'bg-dark-900/50 border border-dark-800 text-dark-400 hover:border-dark-700'
                  }`}
              >
                <div className="font-medium">{method.name}</div>
                <div className="text-xs opacity-70">{method.desc}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Parameters */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="flex justify-between text-sm text-dark-400 mb-2">
              <span>Cutoff Frequency {needsHighCutoff && '(Low)'}</span>
              <span className="text-orange-400 font-mono">{cutoff.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={cutoff}
              onChange={(e) => setCutoff(parseFloat(e.target.value))}
              className="slider"
            />
          </div>
          
          {needsHighCutoff && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="flex justify-between text-sm text-dark-400 mb-2">
                <span>Cutoff Frequency (High)</span>
                <span className="text-orange-400 font-mono">{cutoffHigh.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.01"
                max="0.99"
                step="0.01"
                value={cutoffHigh}
                onChange={(e) => setCutoffHigh(parseFloat(e.target.value))}
                className="slider"
              />
            </motion.div>
          )}
          
          {filterMethod === 'butterworth' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="flex justify-between text-sm text-dark-400 mb-2">
                <span>Filter Order</span>
                <span className="text-orange-400 font-mono">{filterOrder}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={filterOrder}
                onChange={(e) => setFilterOrder(parseInt(e.target.value))}
                className="slider"
              />
            </motion.div>
          )}
        </div>
        
        <button
          onClick={handleApplyFilter}
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? 'Processing...' : `Apply ${selectedFilterData?.name} Filter`}
        </button>
      </div>
    </div>
  )
}

// Frequency Filter Visualization Component
function FrequencyFilterDiagram({ filter, cutoff, cutoffHigh }) {
  const cutoffX = 20 + cutoff * 160
  const cutoffHighX = 20 + cutoffHigh * 160
  
  return (
    <svg viewBox="0 0 200 80" className="w-full h-20">
      {/* Background frequency axis */}
      <rect x="20" y="15" width="160" height="40" fill="#1e293b" rx="4"/>
      
      {filter === 'lowpass' && (
        <>
          <rect x="20" y="15" width={cutoffX - 20} height="40" fill="#22c55e" opacity="0.3" rx="4"/>
          <rect x={cutoffX} y="15" width={180 - cutoffX} height="40" fill="#ef4444" opacity="0.2"/>
          <line x1={cutoffX} y1="12" x2={cutoffX} y2="58" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3,2"/>
        </>
      )}
      
      {filter === 'highpass' && (
        <>
          <rect x="20" y="15" width={cutoffX - 20} height="40" fill="#ef4444" opacity="0.2" rx="4"/>
          <rect x={cutoffX} y="15" width={180 - cutoffX} height="40" fill="#22c55e" opacity="0.3"/>
          <line x1={cutoffX} y1="12" x2={cutoffX} y2="58" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3,2"/>
        </>
      )}
      
      {filter === 'bandpass' && (
        <>
          <rect x="20" y="15" width={cutoffX - 20} height="40" fill="#ef4444" opacity="0.2" rx="4"/>
          <rect x={cutoffX} y="15" width={cutoffHighX - cutoffX} height="40" fill="#22c55e" opacity="0.3"/>
          <rect x={cutoffHighX} y="15" width={180 - cutoffHighX} height="40" fill="#ef4444" opacity="0.2"/>
          <line x1={cutoffX} y1="12" x2={cutoffX} y2="58" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3,2"/>
          <line x1={cutoffHighX} y1="12" x2={cutoffHighX} y2="58" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3,2"/>
        </>
      )}
      
      {filter === 'bandstop' && (
        <>
          <rect x="20" y="15" width={cutoffX - 20} height="40" fill="#22c55e" opacity="0.3" rx="4"/>
          <rect x={cutoffX} y="15" width={cutoffHighX - cutoffX} height="40" fill="#ef4444" opacity="0.2"/>
          <rect x={cutoffHighX} y="15" width={180 - cutoffHighX} height="40" fill="#22c55e" opacity="0.3"/>
          <line x1={cutoffX} y1="12" x2={cutoffX} y2="58" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3,2"/>
          <line x1={cutoffHighX} y1="12" x2={cutoffHighX} y2="58" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3,2"/>
        </>
      )}
      
      {filter === 'notch' && (
        <>
          <rect x="20" y="15" width="160" height="40" fill="#22c55e" opacity="0.3" rx="4"/>
          <rect x={cutoffX - 5} y="15" width="10" height="40" fill="#ef4444" opacity="0.5"/>
          <line x1={cutoffX} y1="12" x2={cutoffX} y2="58" stroke="#ef4444" strokeWidth="2"/>
        </>
      )}
      
      {/* Labels */}
      <text x="30" y="72" fill="#94a3b8" fontSize="7">Low Freq (DC)</text>
      <text x="140" y="72" fill="#94a3b8" fontSize="7">High Freq</text>
      
      {/* Legend */}
      <rect x="20" y="2" width="8" height="8" fill="#22c55e" opacity="0.5" rx="1"/>
      <text x="32" y="9" fill="#22c55e" fontSize="7">Pass</text>
      <rect x="60" y="2" width="8" height="8" fill="#ef4444" opacity="0.5" rx="1"/>
      <text x="72" y="9" fill="#ef4444" fontSize="7">Block</text>
    </svg>
  )
}

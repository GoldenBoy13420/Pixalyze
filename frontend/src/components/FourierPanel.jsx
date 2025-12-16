import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Waves, Target, CircleDot } from 'lucide-react'
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

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Sparkles, Sliders, ChevronDown, Info } from 'lucide-react'
import useStore from '../store/useStore'

const filterCategories = {
  blur: {
    name: 'Blur & Smooth',
    icon: '🌫️',
    filters: ['blur', 'box_blur', 'median', 'bilateral']
  },
  edge: {
    name: 'Edge Detection',
    icon: '✨',
    filters: ['edge_sobel', 'edge_laplacian', 'edge_canny']
  },
  enhance: {
    name: 'Enhancement',
    icon: '💡',
    filters: ['sharpen', 'unsharp_mask', 'emboss']
  },
  frequency: {
    name: 'Frequency',
    icon: '📊',
    filters: ['high_pass', 'low_pass']
  }
}

const filterLabels = {
  blur: 'Gaussian Blur',
  box_blur: 'Box Blur',
  median: 'Median Filter',
  bilateral: 'Bilateral Filter',
  sharpen: 'Sharpen',
  unsharp_mask: 'Unsharp Mask',
  edge_sobel: 'Sobel Edge',
  edge_laplacian: 'Laplacian Edge',
  edge_canny: 'Canny Edge',
  emboss: 'Emboss',
  high_pass: 'High Pass',
  low_pass: 'Low Pass'
}

const filterDefaults = {
  blur: { kernel_size: 5, sigma: 1.0 },
  box_blur: { kernel_size: 5 },
  median: { kernel_size: 5 },
  bilateral: { d: 9, sigma_color: 75, sigma_space: 75 },
  sharpen: { strength: 1.0 },
  unsharp_mask: { sigma: 1.0, strength: 1.5, threshold: 0 },
  edge_sobel: { ksize: 3 },
  edge_laplacian: { ksize: 3 },
  edge_canny: { threshold1: 100, threshold2: 200 },
  emboss: {},
  high_pass: { kernel_size: 3 },
  low_pass: { kernel_size: 5 }
}

// Filter explanations with descriptions
const filterExplanations = {
  blur: {
    title: 'Gaussian Blur',
    description: 'Applies a weighted average using a Gaussian (bell-curve) distribution. Pixels closer to the center have more influence.',
    useCase: 'Great for reducing noise while preserving edges better than box blur.',
    formula: 'G(x,y) = (1/2πσ²) × e^(-(x²+y²)/2σ²)'
  },
  box_blur: {
    title: 'Box Blur',
    description: 'Simple averaging filter where all pixels in the kernel have equal weight.',
    useCase: 'Fast but can produce blocky artifacts. Each output pixel is the mean of its neighborhood.',
    formula: 'Output = (1/n²) × Σ(pixels in n×n window)'
  },
  median: {
    title: 'Median Filter',
    description: 'Replaces each pixel with the median value of its neighborhood.',
    useCase: 'Excellent for removing salt-and-pepper noise while preserving edges.',
    formula: 'Output = median(sorted neighborhood pixels)'
  },
  bilateral: {
    title: 'Bilateral Filter',
    description: 'Edge-preserving smoothing that considers both spatial distance and intensity difference.',
    useCase: 'Ideal for noise reduction in photos while keeping sharp edges intact.',
    formula: 'Weight = Spatial_Gaussian × Intensity_Gaussian'
  },
  sharpen: {
    title: 'Sharpen',
    description: 'Enhances edges and fine details by emphasizing the difference between a pixel and its neighbors.',
    useCase: 'Uses a kernel that subtracts surrounding pixels and amplifies the center.',
    formula: 'Output = Original + α × (Original - Blurred)'
  },
  unsharp_mask: {
    title: 'Unsharp Mask',
    description: 'Classic sharpening technique: subtract a blurred version from original, then add back scaled difference.',
    useCase: 'Provides controllable sharpening with threshold to avoid amplifying noise.',
    formula: 'Sharpened = Original + amount × (Original - Blurred)'
  },
  edge_sobel: {
    title: 'Sobel Edge Detection',
    description: 'Calculates image gradient using two 3×3 kernels for horizontal and vertical edges.',
    useCase: 'Good for finding edges with some noise tolerance.',
    formula: 'G = √(Gx² + Gy²)'
  },
  edge_laplacian: {
    title: 'Laplacian Edge Detection',
    description: 'Second-order derivative filter that detects edges by finding zero-crossings.',
    useCase: 'Detects edges in all directions simultaneously. Sensitive to noise.',
    formula: '∇²f = ∂²f/∂x² + ∂²f/∂y²'
  },
  edge_canny: {
    title: 'Canny Edge Detection',
    description: 'Multi-stage algorithm: Gaussian blur → Gradient calculation → Non-maximum suppression → Hysteresis thresholding.',
    useCase: 'Produces thin, well-connected edges with minimal false detections.',
    formula: 'Strong edges: gradient > high_threshold'
  },
  emboss: {
    title: 'Emboss',
    description: 'Creates a 3D relief effect by emphasizing edges in one direction while suppressing others.',
    useCase: 'The result appears as if the image is pressed into or raised from a surface.',
    formula: 'Directional gradient with offset'
  },
  high_pass: {
    title: 'High Pass Filter',
    description: 'Removes low-frequency components (smooth areas) and keeps high-frequency details (edges, textures).',
    useCase: 'Useful for edge enhancement and detail extraction.',
    formula: 'High Pass = Original - Low Pass'
  },
  low_pass: {
    title: 'Low Pass Filter',
    description: 'Removes high-frequency components (noise, fine details) and keeps low-frequency content.',
    useCase: 'Results in a smoothed/blurred image.',
    formula: 'Attenuates frequencies above cutoff'
  }
}

export default function FilterPanel() {
  const { applyFilter, loadFilters, isLoading } = useStore()
  const [selectedCategory, setSelectedCategory] = useState('blur')
  const [selectedFilter, setSelectedFilter] = useState('blur')
  const [params, setParams] = useState(filterDefaults.blur)
  const [expandedCategory, setExpandedCategory] = useState('blur')
  const [showExplanation, setShowExplanation] = useState(true)
  const debounceTimerRef = useRef(null)
  
  useEffect(() => {
    loadFilters()
  }, [loadFilters])
  
  useEffect(() => {
    setParams(filterDefaults[selectedFilter] || {})
  }, [selectedFilter])
  
  // Memoize filter categories to prevent unnecessary re-renders
  const memoizedCategories = useMemo(() => filterCategories, [])
  
  const handleApply = useCallback(() => {
    applyFilter(selectedFilter, params)
  }, [applyFilter, selectedFilter, params])
  
  // Debounced parameter change for real-time preview
  const handleParamChange = useCallback((key, value) => {
    setParams(prev => ({ ...prev, [key]: value }))
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [])
  
  const renderParameterInput = (key, value) => {
    const isRange = typeof value === 'number'
    
    if (isRange) {
      let min = 0, max = 100, step = 1
      
      // Set appropriate ranges based on parameter type
      if (key.includes('kernel') || key.includes('ksize')) {
        min = 1; max = 21; step = 2
      } else if (key.includes('sigma')) {
        min = 0; max = 10; step = 0.1
      } else if (key.includes('threshold')) {
        min = 0; max = 255; step = 1
      } else if (key.includes('strength')) {
        min = 0; max = 5; step = 0.1
      } else if (key === 'd') {
        min = 1; max = 21; step = 2
      }
      
      return (
        <div key={key} className="space-y-2">
          <label className="flex justify-between text-sm text-dark-400">
            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-primary-400 font-mono">{value}</span>
          </label>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
            className="slider"
          />
        </div>
      )
    }
    
    return null
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 
                        flex items-center justify-center shadow-lg">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Image Filters</h2>
          <p className="text-dark-400 text-sm">Apply spatial domain filters</p>
        </div>
      </div>
      
      {/* Filter Categories */}
      <div className="space-y-3">
        {Object.entries(filterCategories).map(([catId, category]) => (
          <div key={catId} className="card overflow-hidden p-0">
            <button
              onClick={() => setExpandedCategory(expandedCategory === catId ? null : catId)}
              className="w-full flex items-center justify-between p-4 
                         hover:bg-dark-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <span className="font-medium text-dark-200">{category.name}</span>
              </div>
              <motion.div
                animate={{ rotate: expandedCategory === catId ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-dark-500" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {expandedCategory === catId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-dark-800"
                >
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {category.filters.map((filterId) => (
                      <motion.button
                        key={filterId}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedFilter(filterId)
                          setSelectedCategory(catId)
                        }}
                        className={`p-3 rounded-xl text-left transition-all
                          ${selectedFilter === filterId 
                            ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/50' 
                            : 'bg-dark-900/50 border border-dark-800 hover:border-dark-700'
                          }`}
                      >
                        <span className={`font-medium ${selectedFilter === filterId ? 'text-violet-300' : 'text-dark-300'}`}>
                          {filterLabels[filterId]}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Filter Explanation Section */}
      {filterExplanations[selectedFilter] && (
        <motion.div
          key={selectedFilter + '-explanation'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-violet-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-violet-400" />
              <h3 className="font-medium text-violet-300">{filterExplanations[selectedFilter].title}</h3>
            </div>
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs text-dark-400 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-dark-800/50"
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
                <p className="text-dark-300 text-sm">{filterExplanations[selectedFilter].description}</p>
                
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400">💡</span>
                  <span className="text-dark-400">{filterExplanations[selectedFilter].useCase}</span>
                </div>
                
                {/* Formula */}
                <div className="bg-dark-900/50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-1">Formula:</p>
                  <code className="text-violet-300 text-sm font-mono">{filterExplanations[selectedFilter].formula}</code>
                </div>
                
                {/* Visual Diagram - Kernel Visualization for applicable filters */}
                {['blur', 'box_blur', 'sharpen', 'edge_sobel', 'edge_laplacian', 'emboss'].includes(selectedFilter) && (
                  <div className="bg-dark-900/50 rounded-lg p-3">
                    <p className="text-xs text-dark-500 mb-2">Kernel Visualization:</p>
                    <div className="flex justify-center">
                      <FilterKernelDiagram filter={selectedFilter} />
                    </div>
                  </div>
                )}
                
                {/* Frequency response for pass filters */}
                {['high_pass', 'low_pass'].includes(selectedFilter) && (
                  <div className="bg-dark-900/50 rounded-lg p-3">
                    <p className="text-xs text-dark-500 mb-2">Frequency Response:</p>
                    <FrequencyResponseDiagram filter={selectedFilter} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Selected Filter Parameters */}
      <AnimatePresence mode="wait">
        {selectedFilter && Object.keys(params).length > 0 && (
          <motion.div
            key={selectedFilter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-violet-400" />
              <h3 className="font-medium text-dark-200">
                {filterLabels[selectedFilter]} Parameters
              </h3>
            </div>
            
            <div className="space-y-4">
              {Object.entries(params).map(([key, value]) => 
                renderParameterInput(key, value)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={isLoading || !selectedFilter}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {isLoading ? 'Processing...' : `Apply ${filterLabels[selectedFilter]}`}
      </button>
    </div>
  )
}

// Kernel visualization component
function FilterKernelDiagram({ filter }) {
  const kernels = {
    blur: { data: [[1,2,1],[2,4,2],[1,2,1]], label: 'Gaussian (normalized)', scale: 16 },
    box_blur: { data: [[1,1,1],[1,1,1],[1,1,1]], label: '3×3 Box (equal weights)', scale: 9 },
    sharpen: { data: [[0,-1,0],[-1,5,-1],[0,-1,0]], label: 'Sharpening Kernel', scale: 1 },
    edge_sobel: { data: [[-1,0,1],[-2,0,2],[-1,0,1]], label: 'Sobel Gx', scale: 1 },
    edge_laplacian: { data: [[0,1,0],[1,-4,1],[0,1,0]], label: 'Laplacian', scale: 1 },
    emboss: { data: [[-2,-1,0],[-1,1,1],[0,1,2]], label: 'Emboss (diagonal)', scale: 1 }
  }
  
  const kernel = kernels[filter]
  if (!kernel) return null
  
  return (
    <div className="inline-block">
      <div className="grid grid-cols-3 gap-1">
        {kernel.data.flat().map((val, i) => (
          <div 
            key={i}
            className={`w-10 h-10 flex items-center justify-center rounded text-xs font-mono
              ${val > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 
                val < 0 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 
                'bg-dark-700/50 text-dark-400 border border-dark-600/30'}`}
          >
            {val}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-dark-500 mt-2">{kernel.label}</p>
    </div>
  )
}

// Frequency response visualization
function FrequencyResponseDiagram({ filter }) {
  const isHighPass = filter === 'high_pass'
  
  return (
    <svg viewBox="0 0 200 60" className="w-full h-16">
      {/* Background */}
      <rect x="20" y="10" width="160" height="35" fill="#1e293b" rx="4"/>
      
      {/* Blocked region */}
      <rect 
        x={isHighPass ? "20" : "100"} 
        y="10" 
        width="80" 
        height="35" 
        fill="#ef4444" 
        opacity="0.2" 
        rx={isHighPass ? "4 0 0 4" : "0 4 4 0"}
      />
      <text 
        x={isHighPass ? "60" : "140"} 
        y="32" 
        textAnchor="middle" 
        fill="#ef4444" 
        fontSize="8"
      >
        Blocked
      </text>
      
      {/* Passed region */}
      <rect 
        x={isHighPass ? "100" : "20"} 
        y="10" 
        width="80" 
        height="35" 
        fill="#22c55e" 
        opacity="0.2"
        rx={isHighPass ? "0 4 4 0" : "4 0 0 4"}
      />
      <text 
        x={isHighPass ? "140" : "60"} 
        y="32" 
        textAnchor="middle" 
        fill="#22c55e" 
        fontSize="8"
      >
        Passed
      </text>
      
      {/* Labels */}
      <text x="30" y="55" fill="#94a3b8" fontSize="7">Low Freq</text>
      <text x="150" y="55" fill="#94a3b8" fontSize="7">High Freq</text>
      
      {/* Cutoff line */}
      <line x1="100" y1="8" x2="100" y2="47" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3,2"/>
      <text x="100" y="55" textAnchor="middle" fill="#8b5cf6" fontSize="7">Cutoff</text>
    </svg>
  )
}

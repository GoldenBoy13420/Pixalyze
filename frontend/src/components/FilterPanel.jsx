import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Sparkles, Sliders, ChevronDown } from 'lucide-react'
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

export default function FilterPanel() {
  const { applyFilter, loadFilters, isLoading } = useStore()
  const [selectedCategory, setSelectedCategory] = useState('blur')
  const [selectedFilter, setSelectedFilter] = useState('blur')
  const [params, setParams] = useState(filterDefaults.blur)
  const [expandedCategory, setExpandedCategory] = useState('blur')
  
  useEffect(() => {
    loadFilters()
  }, [loadFilters])
  
  useEffect(() => {
    setParams(filterDefaults[selectedFilter] || {})
  }, [selectedFilter])
  
  const handleApply = () => {
    applyFilter(selectedFilter, params)
  }
  
  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }
  
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

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Zap, Sliders, RefreshCw, Info } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import useStore from '../store/useStore'

const equalizationMethods = [
  { id: 'global', name: 'Global', desc: 'Standard histogram equalization' },
  { id: 'clahe', name: 'CLAHE', desc: 'Contrast Limited Adaptive' },
  { id: 'adaptive', name: 'Adaptive', desc: 'Local adaptive equalization' }
]

// Histogram explanations
const histogramExplanations = {
  general: {
    title: 'What is a Histogram?',
    description: 'A histogram shows the distribution of pixel intensity values in an image. The x-axis represents intensity values (0-255), and the y-axis shows how many pixels have each value.',
    useCase: 'Use histograms to analyze image brightness, contrast, and detect exposure issues.'
  },
  global: {
    title: 'Global Histogram Equalization',
    description: 'Redistributes pixel intensities across the full range (0-255) to maximize contrast. Uses the cumulative distribution function (CDF) to map input intensities to output.',
    useCase: 'Best for images with poor contrast where the histogram is concentrated in a small range.',
    formula: 's = T(r) = (L-1) × CDF(r)',
    pros: ['Increases global contrast', 'Simple and fast', 'Works well for images with uniform lighting'],
    cons: ['May over-enhance noise', 'Can wash out details in some areas']
  },
  clahe: {
    title: 'CLAHE (Contrast Limited Adaptive Histogram Equalization)',
    description: 'Divides the image into small tiles and applies histogram equalization locally. The "clip limit" prevents over-amplification of noise by limiting the contrast enhancement.',
    useCase: 'Ideal for medical images, photos with varying lighting, and images where local contrast matters.',
    formula: 'Apply equalization per tile with clipping at limit',
    pros: ['Preserves local contrast', 'Reduces noise amplification', 'Better for varying lighting'],
    cons: ['Computationally more expensive', 'May create tile artifacts if parameters are wrong']
  },
  adaptive: {
    title: 'Adaptive Histogram Equalization (AHE)',
    description: 'Similar to CLAHE but without the clip limit. Each pixel is equalized based on its local neighborhood, providing region-specific contrast enhancement.',
    useCase: 'Good for images where different regions need different levels of enhancement.',
    formula: 'Compute local histogram for each pixel neighborhood',
    pros: ['Region-specific enhancement', 'Good for varied content'],
    cons: ['Can over-amplify noise', 'Computationally intensive']
  }
}

export default function HistogramPanel() {
  const { 
    currentImage, 
    histogram, 
    calculateHistogram, 
    equalizeHistogram,
    isLoading 
  } = useStore()
  
  const [selectedMethod, setSelectedMethod] = useState('global')
  const [clipLimit, setClipLimit] = useState(2.0)
  const [tileSize, setTileSize] = useState(8)
  const [showExplanation, setShowExplanation] = useState(true)
  
  useEffect(() => {
    if (currentImage && !histogram) {
      calculateHistogram()
    }
  }, [currentImage, histogram, calculateHistogram])
  
  const handleEqualize = () => {
    const options = selectedMethod === 'clahe' 
      ? { clip_limit: clipLimit, tile_size: tileSize }
      : {}
    equalizeHistogram(selectedMethod, options)
  }

  const currentExplanation = histogramExplanations[selectedMethod]
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!histogram) return []
    
    // Handle both color and grayscale histograms
    const data = []
    const bins = histogram.gray?.length || histogram.red?.length || 256
    
    for (let i = 0; i < bins; i++) {
      data.push({
        bin: i,
        gray: histogram.gray?.[i] || 0,
        red: histogram.red?.[i] || 0,
        green: histogram.green?.[i] || 0,
        blue: histogram.blue?.[i] || 0
      })
    }
    return data
  }
  
  const chartData = prepareChartData()
  const isGrayscale = histogram?.gray !== undefined
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 
                          flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Histogram Analysis</h2>
            <p className="text-dark-400 text-sm">Analyze and enhance image contrast</p>
          </div>
        </div>
        
        <button
          onClick={calculateHistogram}
          disabled={isLoading}
          className="btn-ghost flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {/* Histogram Chart */}
      <div className="card">
        <h3 className="text-sm font-medium text-dark-300 mb-4">Intensity Distribution</h3>
        
        {histogram ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGray" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="bin" 
                  stroke="#475569" 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  stroke="#475569" 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={{ stroke: '#475569' }}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                
                {isGrayscale ? (
                  <Area 
                    type="monotone" 
                    dataKey="gray" 
                    stroke="#94a3b8" 
                    fillOpacity={1} 
                    fill="url(#colorGray)" 
                  />
                ) : (
                  <>
                    <Area 
                      type="monotone" 
                      dataKey="red" 
                      stroke="#ef4444" 
                      fillOpacity={0.6} 
                      fill="url(#colorRed)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="green" 
                      stroke="#22c55e" 
                      fillOpacity={0.6} 
                      fill="url(#colorGreen)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="blue" 
                      stroke="#3b82f6" 
                      fillOpacity={0.6} 
                      fill="url(#colorBlue)" 
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-dark-700 
                              border-t-emerald-500 animate-spin mx-auto mb-4" />
              <p className="text-dark-400">Loading histogram...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Equalization Methods */}
      <div className="card">
        <h3 className="text-sm font-medium text-dark-300 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          Histogram Equalization
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {equalizationMethods.map((method) => (
            <motion.button
              key={method.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMethod(method.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left
                ${selectedMethod === method.id 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-dark-700 bg-dark-900/30 hover:border-dark-600'
                }`}
            >
              <h4 className="font-semibold text-dark-100">{method.name}</h4>
              <p className="text-dark-500 text-sm mt-1">{method.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Method Explanation */}
        {currentExplanation && (
          <motion.div
            key={selectedMethod + '-explanation'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                <h4 className="font-medium text-emerald-300">{currentExplanation.title}</h4>
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
                  <p className="text-dark-300 text-sm">{currentExplanation.description}</p>
                  
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-400">💡</span>
                    <span className="text-dark-400">{currentExplanation.useCase}</span>
                  </div>
                  
                  {currentExplanation.formula && (
                    <div className="bg-dark-900/50 rounded-lg p-3">
                      <p className="text-xs text-dark-500 mb-1">Formula:</p>
                      <code className="text-emerald-300 text-sm font-mono">{currentExplanation.formula}</code>
                    </div>
                  )}

                  {/* Pros and Cons */}
                  {currentExplanation.pros && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-dark-900/50 rounded-lg p-3">
                        <p className="text-xs text-emerald-400 mb-2">✓ Pros</p>
                        <ul className="text-xs text-dark-400 space-y-1">
                          {currentExplanation.pros.map((pro, i) => (
                            <li key={i}>• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-dark-900/50 rounded-lg p-3">
                        <p className="text-xs text-red-400 mb-2">✗ Cons</p>
                        <ul className="text-xs text-dark-400 space-y-1">
                          {currentExplanation.cons.map((con, i) => (
                            <li key={i}>• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Visual Diagram */}
                  <div className="bg-dark-900/50 rounded-lg p-3">
                    <p className="text-xs text-dark-500 mb-2">How it works:</p>
                    <HistogramEqualizationDiagram method={selectedMethod} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        
        {/* CLAHE Parameters */}
        {selectedMethod === 'clahe' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 mb-6 p-4 bg-dark-900/50 rounded-xl"
          >
            <div className="flex items-center gap-2 text-dark-300 mb-2">
              <Sliders className="w-4 h-4" />
              <span className="text-sm font-medium">CLAHE Parameters</span>
            </div>
            
            <div>
              <label className="flex justify-between text-sm text-dark-400 mb-2">
                <span>Clip Limit</span>
                <span className="text-primary-400">{clipLimit.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={clipLimit}
                onChange={(e) => setClipLimit(parseFloat(e.target.value))}
                className="slider"
              />
            </div>
            
            <div>
              <label className="flex justify-between text-sm text-dark-400 mb-2">
                <span>Tile Size</span>
                <span className="text-primary-400">{tileSize}×{tileSize}</span>
              </label>
              <input
                type="range"
                min="2"
                max="16"
                step="2"
                value={tileSize}
                onChange={(e) => setTileSize(parseInt(e.target.value))}
                className="slider"
              />
            </div>
          </motion.div>
        )}
        
        <button
          onClick={handleEqualize}
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? 'Processing...' : 'Apply Equalization'}
        </button>
      </div>
    </div>
  )
}

// Histogram Equalization Visualization Component
function HistogramEqualizationDiagram({ method }) {
  return (
    <svg viewBox="0 0 200 70" className="w-full h-20">
      {method === 'global' && (
        <>
          {/* Before - concentrated histogram */}
          <rect x="10" y="10" width="70" height="45" fill="#1e293b" rx="4"/>
          <text x="45" y="7" textAnchor="middle" fill="#94a3b8" fontSize="7">Before</text>
          {/* Concentrated bars */}
          {[25,30,35,40,45].map((x, i) => (
            <rect key={i} x={x} y={55 - (15 + i*5)} width="5" height={15 + i*5} fill="#ef4444" opacity="0.6" rx="1"/>
          ))}
          
          {/* Arrow */}
          <path d="M 85 32 L 95 32 L 95 28 L 105 32 L 95 36 L 95 32" fill="#22c55e"/>
          
          {/* After - spread histogram */}
          <rect x="115" y="10" width="70" height="45" fill="#1e293b" rx="4"/>
          <text x="150" y="7" textAnchor="middle" fill="#94a3b8" fontSize="7">After</text>
          {/* Spread bars */}
          {[120,135,150,165,180].map((x, i) => (
            <rect key={i} x={x} y={30} width="8" height={20 + (i % 2) * 5} fill="#22c55e" opacity="0.6" rx="1"/>
          ))}
          
          <text x="100" y="65" textAnchor="middle" fill="#94a3b8" fontSize="7">Spreads intensity across full range</text>
        </>
      )}
      
      {method === 'clahe' && (
        <>
          {/* Image divided into tiles */}
          <rect x="10" y="10" width="60" height="45" fill="#1e293b" rx="4"/>
          <text x="40" y="7" textAnchor="middle" fill="#94a3b8" fontSize="7">Image Tiles</text>
          {/* Grid of tiles */}
          {[0,1,2].map(row => 
            [0,1,2].map(col => (
              <rect key={`${row}-${col}`} x={15 + col*18} y={15 + row*13} width="16" height="11" 
                    fill={`hsl(${160 + row*20 + col*10}, 70%, ${30 + row*10 + col*5}%)`} 
                    stroke="#475569" strokeWidth="0.5" rx="1"/>
            ))
          )}
          
          {/* Arrow */}
          <path d="M 75 32 L 85 32 L 85 28 L 95 32 L 85 36 L 85 32" fill="#8b5cf6"/>
          
          {/* Each tile equalized */}
          <rect x="100" y="10" width="60" height="45" fill="#1e293b" rx="4"/>
          <text x="130" y="7" textAnchor="middle" fill="#94a3b8" fontSize="7">Per-tile Equalization</text>
          {[0,1,2].map(row => 
            [0,1,2].map(col => (
              <rect key={`eq-${row}-${col}`} x={105 + col*18} y={15 + row*13} width="16" height="11" 
                    fill="#22c55e" opacity={0.3 + 0.2 * (row + col)} 
                    stroke="#22c55e" strokeWidth="0.5" rx="1"/>
            ))
          )}
          
          {/* Clip limit indicator */}
          <rect x="165" y="15" width="25" height="35" fill="#1e293b" rx="2"/>
          <line x1="168" y1="30" x2="187" y2="30" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,1"/>
          <text x="177" y="27" textAnchor="middle" fill="#f59e0b" fontSize="6">Clip</text>
          <rect x="172" y="32" width="4" height="15" fill="#8b5cf6" opacity="0.5" rx="1"/>
          <rect x="179" y="38" width="4" height="9" fill="#8b5cf6" opacity="0.5" rx="1"/>
          
          <text x="100" y="65" textAnchor="middle" fill="#94a3b8" fontSize="7">Local enhancement with contrast limiting</text>
        </>
      )}
      
      {method === 'adaptive' && (
        <>
          {/* Pixel with neighborhood */}
          <rect x="10" y="10" width="60" height="45" fill="#1e293b" rx="4"/>
          <text x="40" y="7" textAnchor="middle" fill="#94a3b8" fontSize="7">Local Window</text>
          {/* Neighborhood grid */}
          {[0,1,2,3,4].map(row => 
            [0,1,2,3,4].map(col => {
              const isCenter = row === 2 && col === 2
              return (
                <rect key={`${row}-${col}`} x={18 + col*9} y={15 + row*8} width="8" height="7" 
                      fill={isCenter ? '#ef4444' : '#3b82f6'} 
                      opacity={isCenter ? 0.8 : 0.2 + 0.1 * Math.abs(2-row) + 0.1 * Math.abs(2-col)}
                      stroke="#475569" strokeWidth="0.3" rx="1"/>
              )
            })
          )}
          
          {/* Arrow */}
          <path d="M 75 32 L 85 32 L 85 28 L 95 32 L 85 36 L 85 32" fill="#22c55e"/>
          
          {/* Result - equalized based on local histogram */}
          <rect x="100" y="10" width="60" height="45" fill="#1e293b" rx="4"/>
          <text x="130" y="7" textAnchor="middle" fill="#94a3b8" fontSize="7">Result</text>
          <rect x="118" y="25" width="24" height="20" fill="#22c55e" opacity="0.5" rx="2"/>
          <text x="130" y="38" textAnchor="middle" fill="#e2e8f0" fontSize="8">Enhanced</text>
          
          {/* Moving window indicator */}
          <path d="M 170 20 L 175 25 M 175 20 L 170 25" stroke="#8b5cf6" strokeWidth="1.5"/>
          <path d="M 170 35 L 175 40 M 175 35 L 170 40" stroke="#8b5cf6" strokeWidth="1.5"/>
          <path d="M 170 50 L 175 55 M 175 50 L 170 55" stroke="#8b5cf6" strokeWidth="1.5"/>
          <text x="185" y="40" fill="#8b5cf6" fontSize="6">Slides</text>
          
          <text x="100" y="65" textAnchor="middle" fill="#94a3b8" fontSize="7">Computes local histogram per pixel</text>
        </>
      )}
    </svg>
  )
}

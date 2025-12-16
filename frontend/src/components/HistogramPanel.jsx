import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Zap, Sliders, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import useStore from '../store/useStore'

const equalizationMethods = [
  { id: 'global', name: 'Global', desc: 'Standard histogram equalization' },
  { id: 'clahe', name: 'CLAHE', desc: 'Contrast Limited Adaptive' },
  { id: 'adaptive', name: 'Adaptive', desc: 'Local adaptive equalization' }
]

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

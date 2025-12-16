import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import ImageUpload from '../components/ImageUpload'
import HistogramPanel from '../components/HistogramPanel'
import FilterPanel from '../components/FilterPanel'
import FourierPanel from '../components/FourierPanel'
import NoisePanel from '../components/NoisePanel'
import ResultsDisplay from '../components/ResultsDisplay'

const panels = {
  upload: ImageUpload,
  histogram: HistogramPanel,
  filters: FilterPanel,
  fourier: FourierPanel,
  noise: NoisePanel
}

export default function Home() {
  const { activeTab, currentImage, processedImage } = useStore()
  
  const ActivePanel = panels[activeTab]
  const showResults = currentImage && activeTab !== 'upload'
  
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <div className={`grid gap-6 ${showResults ? 'lg:grid-cols-2' : ''}`}>
        {/* Main Panel */}
        <div className="card">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ActivePanel />
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Results Panel */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="card"
          >
            <ResultsDisplay />
          </motion.div>
        )}
      </div>
      
      {/* Quick Actions Bar */}
      {currentImage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 glass rounded-2xl 
                     px-6 py-3 flex items-center gap-4 shadow-xl border border-dark-700/50"
        >
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img 
                src={currentImage.url} 
                alt="Current" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="max-w-[120px] truncate">{currentImage.filename}</span>
          </div>
          
          <div className="h-6 w-px bg-dark-700" />
          
          <div className="text-xs text-dark-500">
            {currentImage.width} × {currentImage.height}
          </div>
          
          {processedImage && (
            <>
              <div className="h-6 w-px bg-dark-700" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400">Processed</span>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}

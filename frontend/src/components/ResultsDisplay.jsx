import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, SplitSquareHorizontal, Maximize2, X } from 'lucide-react'
import { useState } from 'react'
import useStore from '../store/useStore'

export default function ResultsDisplay() {
  const { currentImage, processedImage, comparisonMode, setComparisonMode } = useStore()
  const [fullscreen, setFullscreen] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  
  const hasResult = currentImage || processedImage
  
  if (!hasResult) {
    return (
      <div className="h-full flex items-center justify-center text-dark-500">
        <div className="text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Upload an image to get started</p>
        </div>
      </div>
    )
  }
  
  const handleSliderMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }
  
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-dark-200">Result Preview</h3>
        <div className="flex items-center gap-2">
          {processedImage && currentImage && (
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`btn-ghost flex items-center gap-2 ${comparisonMode ? 'text-primary-400' : ''}`}
            >
              <SplitSquareHorizontal className="w-4 h-4" />
              Compare
            </button>
          )}
          <button
            onClick={() => setFullscreen(true)}
            className="btn-ghost"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Image Display */}
      <div className="relative rounded-xl overflow-hidden bg-dark-950 border border-dark-800">
        {comparisonMode && currentImage && processedImage ? (
          <div 
            className="relative aspect-video cursor-ew-resize"
            onMouseMove={handleSliderMove}
          >
            {/* Original Image */}
            <img
              src={currentImage.url}
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain"
            />
            
            {/* Processed Image with clip */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={processedImage.url}
                alt="Processed"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            
            {/* Slider */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                              w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                <SplitSquareHorizontal className="w-4 h-4 text-dark-800" />
              </div>
            </div>
            
            {/* Labels */}
            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-dark-900/80 text-sm text-dark-200">
              Original
            </div>
            <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-dark-900/80 text-sm text-dark-200">
              Processed
            </div>
          </div>
        ) : (
          <motion.img
            key={processedImage?.url || currentImage?.url}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={processedImage?.url || currentImage?.url}
            alt="Result"
            className="w-full aspect-video object-contain"
          />
        )}
      </div>
      
      {/* Fullscreen Modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark-950/95 backdrop-blur-xl 
                       flex items-center justify-center p-8"
            onClick={() => setFullscreen(false)}
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-dark-800 
                         text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={processedImage?.url || currentImage?.url}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Trash2, ArrowRight } from 'lucide-react'
import { Image as ImageIcon } from 'lucide-react'
import useStore from '../store/useStore'

export default function Home() {
  const { savedImages, removeSavedImage, clearSavedImages, loadSavedImage, isLoading } = useStore()
  
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-6"
        >
          <img 
            src="/logo.png" 
            alt="Pixalyze Logo" 
            className="w-48 h-48 mx-auto object-contain"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div 
            className="hidden w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 
                       items-center justify-center mx-auto shadow-2xl glow-effect"
          >
            <ImageIcon className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
          Pixalyze
        </h1>
        <p className="text-dark-400 text-sm mb-4">DATA DRIVEN VISUALS</p>
        <p className="text-dark-400 text-lg max-w-2xl mx-auto mb-8">
          Your powerful image processing companion. Start editing by going to the Editor.
        </p>
        
        <Link
          to="/editor"
          className="inline-flex items-center gap-2 btn-primary px-8 py-3 text-lg"
        >
          Go to Editor
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>

      {/* Saved Images Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-dark-100">Saved Images</h2>
            <p className="text-dark-400 text-sm">Your processed images are stored here</p>
          </div>
          
          {savedImages && savedImages.length > 0 && (
            <button
              onClick={clearSavedImages}
              className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              Clear All
            </button>
          )}
        </div>
        
        {isLoading && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full border-4 border-dark-700 border-t-primary-500 animate-spin mx-auto" />
            <p className="mt-4 text-dark-400">Loading image...</p>
          </div>
        )}
        
        {!isLoading && (!savedImages || savedImages.length === 0) ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-dark-800/50 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-dark-500" />
            </div>
            <p className="text-dark-400 mb-2">No saved images yet</p>
            <p className="text-dark-500 text-sm">
              Process images in the Editor and click Save to store them here
            </p>
          </div>
        ) : !isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
              {savedImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative aspect-square rounded-xl overflow-hidden 
                             bg-dark-800 border border-dark-700 hover:border-dark-600 transition-all"
                >
                  <img
                    src={image.url}
                    alt={image.name || `Saved image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent 
                                  opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs truncate mb-2">
                        {image.name || `Image ${index + 1}`}
                      </p>
                      <div className="flex gap-2">
                        <Link
                          to="/editor"
                          onClick={() => loadSavedImage(image)}
                          className={`flex-1 btn-primary text-xs py-1.5 text-center ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => removeSavedImage(image.id)}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 
                                     hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Operation badge */}
                  {image.operation && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md 
                                    bg-dark-900/80 text-xs text-dark-300 truncate max-w-[80%]">
                      {image.operation}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mt-12 pb-6"
      >
        <p className="text-dark-500 text-sm">
          Powered by <span className="text-primary-400 font-medium">Golden Boy</span>
        </p>
      </motion.div>
    </div>
  )
}

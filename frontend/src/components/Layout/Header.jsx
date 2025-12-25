import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Download, 
  Undo2, 
  Save,
  Image as ImageIcon
} from 'lucide-react'
import useStore from '../../store/useStore'

export default function Header() {
  const location = useLocation()
  const { processedImage, currentImage, downloadImage, undoLastOperation, imageHistory, saveCurrentImage } = useStore()
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-dark-800/50">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
          >
            <img 
              src="/logo.png" 
              alt="Pixalyze" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.classList.add('bg-gradient-to-br', 'from-primary-500', 'to-accent-500', 'shadow-lg', 'glow-effect')
                e.target.parentElement.innerHTML = '<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
              }}
            />
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold gradient-text">
              Pixalyze
            </h1>
            <p className="text-xs text-dark-400">Data Driven Visuals</p>
          </div>
        </Link>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link 
            to="/"
            className={`btn-ghost ${location.pathname === '/' ? 'text-primary-400 bg-dark-800/50' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/editor"
            className={`btn-ghost ${location.pathname === '/editor' ? 'text-primary-400 bg-dark-800/50' : ''}`}
          >
            Editor
          </Link>
        </nav>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {imageHistory.length > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={undoLastOperation}
              className="p-2 rounded-lg text-dark-400 hover:text-dark-100 
                         hover:bg-dark-800/50 transition-all"
              title="Undo last operation"
            >
              <Undo2 className="w-5 h-5" />
            </motion.button>
          )}
          
          {(processedImage || currentImage) && (
            <>
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={downloadImage}
                className="btn-secondary flex items-center gap-2 py-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </motion.button>
              
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={saveCurrentImage}
                className="btn-primary flex items-center gap-2 py-2"
                title="Save to Home"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </motion.button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Download, 
  Undo2, 
  Moon, 
  Sun, 
  Github, 
  Sparkles,
  Image as ImageIcon
} from 'lucide-react'
import useStore from '../../store/useStore'

export default function Header() {
  const location = useLocation()
  const { processedImage, currentImage, downloadImage, undoLastOperation, imageHistory } = useStore()
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-dark-800/50">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 
                       flex items-center justify-center shadow-lg glow-effect"
          >
            <ImageIcon className="w-5 h-5 text-white" />
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
              Pixalyze
              <Sparkles className="w-4 h-4 text-accent-400" />
            </h1>
            <p className="text-xs text-dark-400">Image Processing & Analysis</p>
          </div>
        </Link>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link 
            to="/"
            className={`btn-ghost ${location.pathname === '/' ? 'text-primary-400 bg-dark-800/50' : ''}`}
          >
            Editor
          </Link>
          <Link 
            to="/about"
            className={`btn-ghost ${location.pathname === '/about' ? 'text-primary-400 bg-dark-800/50' : ''}`}
          >
            About
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
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={downloadImage}
              className="btn-secondary flex items-center gap-2 py-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </motion.button>
          )}
          
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-dark-400 hover:text-dark-100 
                       hover:bg-dark-800/50 transition-all"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import useStore from '../../store/useStore'

export default function Layout({ children }) {
  const { currentImage } = useStore()
  const location = useLocation()
  const isEditorPage = location.pathname === '/editor'
  const showSidebar = isEditorPage && currentImage
  
  return (
    <div className="min-h-screen flex flex-col noise-bg">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950/30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full filter blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl animate-float" />
      </div>
      
      <Header />
      
      <div className="flex flex-1 pt-16">
        {/* Only show sidebar on editor page when image is uploaded */}
        <AnimatePresence>
          {showSidebar && <Sidebar />}
        </AnimatePresence>
        
        <main className={`flex-1 p-6 overflow-auto transition-all duration-300 ${showSidebar ? 'ml-20 lg:ml-64' : 'ml-0'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

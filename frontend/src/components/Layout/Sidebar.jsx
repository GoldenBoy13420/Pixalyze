import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Layers, 
  Radio, 
  Volume2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import useStore from '../../store/useStore'

// Removed Upload tab - upload is only on home page now
const tabs = [
  { id: 'histogram', label: 'Histogram', icon: BarChart3, color: 'from-emerald-500 to-teal-500' },
  { id: 'filters', label: 'Filters', icon: Layers, color: 'from-violet-500 to-purple-500' },
  { id: 'fourier', label: 'Fourier', icon: Radio, color: 'from-orange-500 to-red-500' },
  { id: 'noise', label: 'Noise', icon: Volume2, color: 'from-pink-500 to-rose-500' },
]

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const { activeTab, setActiveTab } = useStore()
  
  const toggleSidebar = () => setIsExpanded(!isExpanded)
  
  return (
    <motion.aside
      initial={{ x: -256, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isExpanded ? 256 : 80 }}
      exit={{ x: -256, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-16 bottom-0 glass border-r border-dark-800/50 
                 flex flex-col z-40 overflow-hidden"
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-dark-800 
                   border border-dark-700 flex items-center justify-center
                   text-dark-400 hover:text-dark-100 hover:bg-dark-700 
                   transition-all z-50"
      >
        {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      
      {/* Navigation */}
      <nav className="flex-1 py-6 px-3">
        <div className="space-y-2">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <motion.button
                key={tab.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200 group relative overflow-hidden cursor-pointer
                  ${isActive 
                    ? 'bg-gradient-to-r ' + tab.color + ' text-white shadow-lg' 
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/50'
                  }
                `}
              >
                {/* Background glow effect */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-gradient-to-r opacity-20"
                    style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                
                <motion.span
                  initial={false}
                  animate={{ 
                    opacity: isExpanded ? 1 : 0,
                    width: isExpanded ? 'auto' : 0 
                  }}
                  className="font-medium whitespace-nowrap overflow-hidden"
                >
                  {tab.label}
                </motion.span>
                
                {/* Active indicator */}
                {isActive && !isExpanded && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 
                               bg-white rounded-r-full"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-dark-800/50">
        <motion.div
          initial={false}
          animate={{ opacity: isExpanded ? 1 : 0 }}
          className="text-center"
        >
          <p className="text-xs text-dark-500">
            Pixalyze v1.0
          </p>
          <p className="text-xs text-dark-600 mt-1">
            Powered by Flask + React
          </p>
        </motion.div>
      </div>
    </motion.aside>
  )
}

import { motion } from 'framer-motion'
import { 
  Github, 
  Heart, 
  Zap, 
  Shield, 
  Sparkles, 
  Globe, 
  Code,
  BookOpen,
  Users,
  Cpu
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process images in milliseconds with optimized algorithms powered by OpenCV and NumPy.',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'All processing happens locally. Your images never leave your machine.',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Sparkles,
    title: '20+ Operations',
    description: 'From histogram equalization to FFT, we have all the image processing tools you need.',
    color: 'from-purple-500 to-violet-500'
  },
  {
    icon: Globe,
    title: 'Web-Based',
    description: 'No installation required. Works in any modern browser on any device.',
    color: 'from-blue-500 to-cyan-500'
  }
]

const algorithms = [
  { name: 'Histogram Equalization', category: 'Enhancement' },
  { name: 'CLAHE', category: 'Enhancement' },
  { name: 'Sobel Edge Detection', category: 'Edge Detection' },
  { name: 'Laplacian Edge Detection', category: 'Edge Detection' },
  { name: 'Canny Edge Detection', category: 'Edge Detection' },
  { name: 'Gaussian Blur', category: 'Filtering' },
  { name: 'Bilateral Filter', category: 'Filtering' },
  { name: 'Median Filter', category: 'Noise Removal' },
  { name: 'Non-Local Means', category: 'Noise Removal' },
  { name: 'FFT Transform', category: 'Frequency Domain' },
  { name: 'Frequency Filters', category: 'Frequency Domain' },
  { name: 'Notch Filter', category: 'Frequency Domain' }
]

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl 
                     bg-gradient-to-br from-primary-500 to-accent-500 mb-6 shadow-lg glow-effect"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
          ImageFX Studio
        </h1>
        <p className="text-xl text-dark-300 max-w-2xl mx-auto">
          A modern, powerful image processing application built with React and Flask. 
          Transform your images with professional-grade algorithms.
        </p>
      </motion.div>
      
      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card hover-glow"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} 
                            flex items-center justify-center mb-4`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-dark-400">{feature.description}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Algorithms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 
                          flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Supported Algorithms</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {algorithms.map((algo, i) => (
            <motion.span
              key={algo.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.03 }}
              className="px-3 py-1.5 rounded-full bg-dark-800 text-dark-300 text-sm
                         border border-dark-700 hover:border-dark-600 transition-colors"
            >
              {algo.name}
            </motion.span>
          ))}
        </div>
      </motion.div>
      
      {/* Tech Stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 
                          flex items-center justify-center">
            <Code className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Built With</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'React', icon: '⚛️', desc: 'Frontend UI' },
            { name: 'Flask', icon: '🌶️', desc: 'Backend API' },
            { name: 'OpenCV', icon: '👁️', desc: 'Image Processing' },
            { name: 'NumPy', icon: '🔢', desc: 'Computations' },
            { name: 'Tailwind', icon: '🎨', desc: 'Styling' },
            { name: 'Framer Motion', icon: '✨', desc: 'Animations' },
            { name: 'Recharts', icon: '📊', desc: 'Visualizations' },
            { name: 'Zustand', icon: '🐻', desc: 'State Management' }
          ].map((tech) => (
            <div 
              key={tech.name}
              className="p-4 rounded-xl bg-dark-900/50 border border-dark-800 text-center"
            >
              <div className="text-2xl mb-2">{tech.icon}</div>
              <div className="font-medium text-dark-200">{tech.name}</div>
              <div className="text-xs text-dark-500">{tech.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Use Cases */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 
                          flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Who Is This For?</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { emoji: '📸', title: 'Photographers', desc: 'Enhance photos, adjust contrast, remove noise' },
            { emoji: '🎓', title: 'Students', desc: 'Learn digital signal processing concepts' },
            { emoji: '🔬', title: 'Researchers', desc: 'Prototype image processing pipelines' },
            { emoji: '👨‍💻', title: 'Developers', desc: 'Integrate via API or extend the codebase' }
          ].map((user) => (
            <div 
              key={user.title}
              className="flex items-start gap-4 p-4 rounded-xl bg-dark-900/30"
            >
              <span className="text-3xl">{user.emoji}</span>
              <div>
                <h4 className="font-semibold text-dark-200">{user.title}</h4>
                <p className="text-sm text-dark-500">{user.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center py-8 border-t border-dark-800"
      >
        <p className="text-dark-500 flex items-center justify-center gap-2">
          Made with <Heart className="w-4 h-4 text-red-500" /> using React + Flask
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-dark-400 hover:text-white transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
          <a 
            href="#" 
            className="text-dark-400 hover:text-white transition-colors"
          >
            <BookOpen className="w-5 h-5" />
          </a>
        </div>
      </motion.div>
    </div>
  )
}

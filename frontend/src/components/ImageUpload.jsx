import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image as ImageIcon, X, FileImage, Sparkles } from 'lucide-react'
import useStore from '../store/useStore'

export default function ImageUpload() {
  const { uploadImage, isLoading, currentImage, clearImage } = useStore()
  const [preview, setPreview] = useState(null)
  
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    // Create preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
    
    // Upload
    await uploadImage(file)
  }, [uploadImage])
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff']
    },
    maxSize: 16 * 1024 * 1024, // 16MB
    multiple: false
  })
  
  const handleClear = (e) => {
    e.stopPropagation()
    setPreview(null)
    clearImage()
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                     bg-gradient-to-br from-primary-500 to-accent-500 mb-4 shadow-lg glow-effect"
        >
          <Upload className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Upload Your Image</h2>
      </div>
      
      {/* Dropzone */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="relative"
      >
        <div
          {...getRootProps()}
          className={`
            relative overflow-hidden rounded-2xl border-2 border-dashed 
            transition-all duration-300 cursor-pointer
            ${isDragActive && !isDragReject 
              ? 'border-primary-500 bg-primary-500/10' 
              : isDragReject
                ? 'border-red-500 bg-red-500/10'
                : 'border-dark-700 hover:border-dark-600 bg-dark-900/30'
            }
            ${isLoading ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
          
          <div className="relative p-12 flex flex-col items-center justify-center min-h-[300px]">
            <AnimatePresence mode="wait">
              {currentImage ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <img
                    src={currentImage.url}
                    alt="Uploaded"
                    className="max-h-64 rounded-xl shadow-2xl object-contain"
                  />
                  <button
                    onClick={handleClear}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full 
                               bg-red-500 text-white flex items-center justify-center
                               opacity-0 group-hover:opacity-100 transition-opacity
                               hover:bg-red-600 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="mt-4 text-center">
                    <p className="text-dark-200 font-medium">{currentImage.filename}</p>
                    <p className="text-dark-500 text-sm">
                      {currentImage.width} × {currentImage.height} • {currentImage.channels} channels
                    </p>
                  </div>
                </motion.div>
              ) : isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-dark-700 
                                  border-t-primary-500 animate-spin" />
                  <p className="mt-4 text-dark-400">Processing image...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ y: isDragActive ? -10 : 0 }}
                    className="w-20 h-20 rounded-2xl bg-dark-800/50 
                               flex items-center justify-center mb-4"
                  >
                    {isDragReject ? (
                      <X className="w-10 h-10 text-red-500" />
                    ) : isDragActive ? (
                      <Sparkles className="w-10 h-10 text-primary-400" />
                    ) : (
                      <FileImage className="w-10 h-10 text-dark-500" />
                    )}
                  </motion.div>
                  
                  <p className="text-lg font-medium text-dark-200 mb-2">
                    {isDragReject 
                      ? 'Invalid file type!' 
                      : isDragActive 
                        ? 'Drop it here!' 
                        : 'Drag & drop your image here'
                    }
                  </p>
                  <p className="text-dark-500 text-sm mb-4">
                    or click to browse files
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['PNG', 'JPG', 'GIF', 'BMP', 'TIFF'].map((format) => (
                      <span 
                        key={format}
                        className="px-3 py-1 rounded-full bg-dark-800/50 
                                   text-dark-400 text-xs font-medium"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from "framer-motion"
import { 
  Camera, Upload, X, User, ArrowRight, MoveLeft, Check, 
  Smile, Star, Sparkles, Crown
} from "lucide-react"
import { useAuth } from '../../Context/Authcontext.jsx'
import { uploadProfile } from '../../services/userservices.js'
import toast from 'react-hot-toast'

function ProfilePicturePage() {
  const [selectedOption, setSelectedOption] = useState(null) // 'upload' or 'avatar'
  const [uploadedImage, setUploadedImage] = useState(null)
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Realistic human avatars
  const avatarOptions = [
    { id: 1, image: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Alice', name: 'Adventurer Girl', gradient: 'from-pink-400 to-rose-500' },
    { id: 2, image: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Bob', name: 'Cool Guy', gradient: 'from-blue-400 to-indigo-500' },
    { id: 3, image: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Charlie', name: 'Friendly Dude', gradient: 'from-purple-400 to-pink-500' },
    { id: 4, image: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Daisy', name: 'Creative Girl', gradient: 'from-green-400 to-teal-500' },
    { id: 5, image: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Eve', name: 'Smiling Woman', gradient: 'from-yellow-400 to-orange-500' },
    { id: 6, image: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Frank', name: 'Business Man', gradient: 'from-cyan-400 to-blue-500' },
    { id: 7, image: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Grace', name: 'Casual Girl', gradient: 'from-red-400 to-pink-500' },
    { id: 8, image: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Henry', name: 'Modern Man', gradient: 'from-indigo-400 to-purple-500' }
  ];

  // Handle file upload
  const handleFileUpload = (file) => {
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors("Image must be less than 5MB")
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors("Please select an image file")
        return
      }

      setUploadedImage(file)
      setSelectedAvatar(null)
      setSelectedOption('upload')

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
      setErrors('')
    }
  }

  // Handle file input change
  const handleInputChange = (e) => {
    const file = e.target.files[0]
    handleFileUpload(file)
  }

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileUpload(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  // Handle avatar selection
  const handleAvatarSelect = (avatarId) => {
    const avatar = avatarOptions.find(a => a.id === avatarId)
    setSelectedAvatar(avatar)
    setUploadedImage(null)
    setImagePreview(null)
    setSelectedOption('avatar')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove selection
  const removeSelection = () => {
    setSelectedAvatar(null)
    setUploadedImage(null)
    setImagePreview(null)
    setSelectedOption(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle skip
  const handleSkip = () => {
    console.log("Skipped profile picture")
    navigate('/');
  }

 const handleAddAsPFP = async () => {
  if (!selectedOption) {
    toast.error("Please select a profile picture");
    return;
  }

  setIsUploading(true);

  try {
    let fileToUpload;
    if (selectedOption === 'upload' && uploadedImage) {
      // For uploaded files, use directly
      fileToUpload = uploadedImage;
    } else if (selectedOption === 'avatar' && selectedAvatar) {
      // Convert avatar URL to File object
      const avatarResponse = await fetch(selectedAvatar.image);
      const blob = await avatarResponse.blob();
      fileToUpload = new File([blob], `avatar-${selectedAvatar.id}.svg`, { type: 'image/svg+xml' });
    }

    if (!fileToUpload) {
      toast.error("Error processing image");
      return;
    }

    const response = await uploadProfile(fileToUpload, user.ID);

    if (response && response.success) {
      toast.success("Profile picture updated successfully");
      navigate('/');
    } else {
      toast.error("Error updating profile picture");
    }

  } catch (error) {
    console.error('Error in handleAddAsPFP:', error);
    toast.error("Error processing profile picture");
  } finally {
    setIsUploading(false);
  }
}

  // Get current display image
  const getCurrentDisplayImage = () => {
    if (imagePreview) {
      return (
        <img
          src={imagePreview}
          alt="Profile preview"
          className="w-full h-full object-cover"
        />
      )
    } else if (selectedAvatar) {
      return (
        <>
          <img
            src={selectedAvatar.image}
            alt={selectedAvatar.name}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-br ${selectedAvatar.gradient} opacity-20`}></div>
        </>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center text-white/40">
        <User className="w-16 h-16 mb-4" />
        <p className="text-sm">No image selected</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      {/* Back button */}
      <motion.div 
        className='absolute top-6 left-6'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate(-1)}
          className='flex items-center gap-2 text-white/80 hover:text-cyan-300 transition-all duration-300 group'
        >
          <MoveLeft className='h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300' />
          Back
        </button>
      </motion.div>

      {/* Skip button */}
      <motion.div 
        className='absolute top-6 right-6'
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={handleSkip}
          className='text-white/60 hover:text-white text-sm font-medium transition-colors duration-300'
        >
          Skip for now →
        </button>
      </motion.div>

      {/* Header */}
      <motion.div 
        className='sm:mx-auto sm:w-full sm:max-w-2xl mb-8'
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className='text-center'>
          <motion.div
            className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Camera className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h1 
            className='text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-cyan-200 bg-clip-text'
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Choose Your Profile Picture
          </motion.h1>
          <motion.p 
            className='text-white/60 text-lg'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Upload a photo or select an avatar to personalize your BidWaza profile
          </motion.p>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className='sm:mx-auto sm:w-full sm:max-w-4xl'
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8'>
          
          {/* Preview Section */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl relative">
                {getCurrentDisplayImage()}
              </div>
              
              {(selectedOption) && (
                <motion.button
                  onClick={removeSelection}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Upload Section */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Upload Your Photo</h3>
            
            {/* Drag & Drop Area */}
            <motion.div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                dragOver 
                  ? 'border-cyan-400 bg-cyan-400/10' 
                  : 'border-white/30 hover:border-white/50 hover:bg-white/5'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Upload className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Drop your image here or click to browse</p>
              <p className="text-white/40 text-sm">Supports JPG, PNG, GIF (Max: 5MB)</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </motion.div>

            {errors && (
              <motion.p
                className="text-red-400 text-sm text-center mt-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors}
              </motion.p>
            )}
          </motion.div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 text-white/60">
                or choose an avatar
              </span>
            </div>
          </div>

          {/* Avatar Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Select an Avatar</h3>
            
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4 max-h-80 overflow-y-auto custom-scrollbar p-2">
              {avatarOptions.map((avatar, index) => (
                <motion.button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  className={`relative w-16 h-16 rounded-full overflow-hidden cursor-pointer
                             hover:scale-105 transition-all duration-300 shadow-lg
                             ${selectedAvatar?.id === avatar.id ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-800' : ''}
                             border-2 border-white/20 hover:border-cyan-400/50`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.03 }}
                  title={avatar.name}
                >
                  <img
                    src={avatar.image}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${avatar.gradient} opacity-20`} />
                  
                  {selectedAvatar?.id === avatar.id && (
                    <motion.div
                      className="absolute inset-0 bg-cyan-400/30 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex gap-4 mt-8 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              onClick={handleSkip}
              disabled={isUploading}
              className='px-8 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Skip for Now
            </motion.button>
            
            <motion.button
              onClick={handleAddAsPFP}
              disabled={!selectedOption || isUploading}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                selectedOption && !isUploading
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-cyan-500/50'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
              whileHover={selectedOption && !isUploading ? { scale: 1.02 } : {}}
              whileTap={selectedOption && !isUploading ? { scale: 0.98 } : {}}
            >
              <Camera className="w-5 h-5" />
              {isUploading ? 'Uploading...' : 'Add as Profile Picture'}
              {!isUploading && <ArrowRight className="w-5 h-5" />}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Custom Scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.8);
        }
      `}</style>
    </div>
  )
}

export default ProfilePicturePage
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { X, Zap, Image as ImageIcon, Trash2 } from "lucide-react"
import { addProduct, updateProduct } from '../../services/sellerservices.js'
import toast from 'react-hot-toast'

// Helper function to format datetime for input
const formatDateTimeLocal = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function CreateListingModal({ isOpen, onClose, editData = null }) {
  const isEditMode = !!editData
  
  const getInitialFormData = () => {
    if (editData) {
      return {
        title: editData.title || '',
        description: editData.description || '',
        category: editData.category || '',
        stock: editData.stock?.toString() || '1',
        product_type: editData.productType || 'DIRECT_SELL',
        amount: editData.price?.toString() || '',
        starting_price: editData.startingPrice?.toString() || '',
        start_time: editData.startTime ? formatDateTimeLocal(editData.startTime) : '',
        end_time: editData.endTime ? formatDateTimeLocal(editData.endTime) : '',
        registration_end: editData.registrationEnd ? formatDateTimeLocal(editData.registrationEnd) : ''
      }
    }
    return {
      title: '',
      description: '',
      category: '',
      stock: '',
      product_type: 'DIRECT_SELL',
      amount: '',
      starting_price: '',
      start_time: '',
      end_time: '',
      registration_end: ''
    }
  }

  const [formData, setFormData] = useState(getInitialFormData())
  
  // Image state for Cloudinary approach
  const [newImages, setNewImages] = useState([]) // New files to upload
  const [newImagePreviews, setNewImagePreviews] = useState([]) // Previews for new files
  const [existingImages, setExistingImages] = useState([]) // Existing Cloudinary image objects
  const [deletedImageUrls, setDeletedImageUrls] = useState([]) // URLs of images to delete from Cloudinary
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
   
  // Load edit data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData(getInitialFormData())
        
        // Load existing images
        if (editData.images && editData.images.length > 0) {
          setExistingImages(editData.images)
        } else {
          setExistingImages([])
        }
      } else {
        resetForm()
      }
      
      // Always reset new images and deleted URLs
      setNewImages([])
      setNewImagePreviews([])
      setDeletedImageUrls([])
    }
  }, [isOpen, editData])

  // Auto-set stock to 1 for auction types
  useEffect(() => {
    if (formData.product_type === 'AUCTION' || formData.product_type === 'REGISTRATION') {
      setFormData(prev => ({
        ...prev,
        stock: '1'
      }))
    }
  }, [formData.product_type])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length === 0) return
    
    // Calculate total images (existing + new uploads)
    const totalImages = existingImages.length + newImages.length + files.length
    
    if (totalImages > 5) {
      setError('Maximum 5 images allowed')
      return
    }

    // Add to new images array
    setNewImages(prev => [...prev, ...files])
    
    // Create previews for new images
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeExistingImage = (index) => {
    const imageToRemove = existingImages[index]
    
    // Add URL to deleted list (for Cloudinary cleanup)
    setDeletedImageUrls(prev => [...prev, imageToRemove.url])
    
    // Remove from existing images
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeNewImage = (index) => {
    // Remove from new images and previews
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.title.trim() || !formData.description.trim() || 
          !formData.category || !formData.product_type) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      if (!formData.stock) {
        setError('Stock is required')
        setLoading(false)
        return
      }

      if (parseInt(formData.stock) <= 0) {
        setError('Stock must be greater than 0')
        setLoading(false)
        return
      }

      // Validate direct sell amount
      if (formData.product_type === 'DIRECT_SELL') {
        if (!formData.amount) {
          setError('Price is required for direct sell products')
          setLoading(false)
          return
        }
        if (parseFloat(formData.amount) <= 0) {
          setError('Price must be greater than 0')
          setLoading(false)
          return
        }
      }

      // Validate auction fields
      if (formData.product_type === 'AUCTION' || formData.product_type === 'REGISTRATION') {
        if (!formData.starting_price || !formData.start_time || !formData.end_time) {
          setError('Starting price, start time, and end time are required for auctions')
          setLoading(false)
          return
        }

        if (parseFloat(formData.starting_price) <= 0) {
          setError('Starting bid price must be greater than 0')
          setLoading(false)
          return
        }

        const startTime = new Date(formData.start_time)
        const endTime = new Date(formData.end_time)
        const now = new Date()

        if (!isEditMode && startTime < now) {
          setError('Auction start time must be in the future')
          setLoading(false)
          return
        }

        if (endTime <= startTime) {
          setError('Auction end time must be after start time')
          setLoading(false)
          return
        }
        
        if (formData.product_type === 'REGISTRATION') {
          if (!formData.registration_end) {
            setError('Registration end time is required for registration-type auctions')
            setLoading(false)
            return
          }

          const registrationEnd = new Date(formData.registration_end)

          if (!isEditMode && registrationEnd < now) {
            setError('Registration end time must be in the future')
            setLoading(false)
            return
          }

          if (registrationEnd >= startTime) {
            setError('Registration must end before auction starts')
            setLoading(false)
            return
          }
        }
      }

      // Validate images (at least one image total)
      const totalImages = existingImages.length + newImages.length
      if (totalImages === 0) {
        setError('At least one product image is required')
        setLoading(false)
        return
      }

      // Prepare data for submission
      const submitData = { ...formData }
      
      // Set amount to 0 for auction types
      if (formData.product_type === 'AUCTION' || formData.product_type === 'REGISTRATION') {
        submitData.amount = 0
      }

      if (isEditMode) {
        // EDIT MODE: Update existing listing
        console.log('Edit Mode - Submitting:', {
          listingId: editData.id,
          formData: submitData,
          existingImages: existingImages, // Keep these image objects
          newImages: newImages.length, // Count of new files to upload
          deletedImageUrls: deletedImageUrls // Delete these from Cloudinary
        })

        const response = await updateProduct(
          editData.id,
          submitData,
          newImages, // New image files to upload to Cloudinary
          existingImages, // Keep these existing image objects
          deletedImageUrls // Delete these URLs from Cloudinary
        )
        
        if (response.success) {
          toast.success("Product updated successfully")
          resetForm()
          onClose()
          window.location.reload()
        } else {
          setError(response.message || 'Failed to update listing')
        }
      } else {
        // CREATE MODE: New listing
        const response = await addProduct(submitData, newImages)
        if (response.success) {
          toast.success("Product listed successfully")
          resetForm()
          onClose()
          window.location.reload()
        } else {
          setError(response.message || 'Failed to create listing')
        }
      }

    } catch (err) {
      console.error('Error saving listing:', err)
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} listing`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      stock: '',
      product_type: 'DIRECT_SELL',
      amount: '',
      starting_price: '',
      start_time: '',
      end_time: '',
      registration_end: ''
    })
    setNewImages([])
    setNewImagePreviews([])
    setExistingImages([])
    setDeletedImageUrls([])
    setError('')
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  // Check if product type can be changed
  const canChangeProductType = !isEditMode || 
    (editData?.productType === 'DIRECT_SELL') || 
    (editData?.totalBids === 0)

  // Calculate total images for display
  const totalCurrentImages = existingImages.length + newImages.length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-white/20 p-6 flex justify-between backdrop-blur-md z-10">
                <h2 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Edit Listing' : 'Create New Listing'}
                </h2>
                <button 
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6 text-white/60" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {isEditMode && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <p className="text-cyan-400 text-sm">
                      📝 Editing: {editData.title}
                    </p>
                  </div>
                )}

                {/* Product Type Selection */}
                <div>
                  <label className="block text-white font-semibold mb-2">Product Type *</label>
                  <select 
                    name="product_type"
                    value={formData.product_type}
                    onChange={handleInputChange}
                    disabled={loading || !canChangeProductType}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="DIRECT_SELL" className="bg-slate-800 text-white">Direct Sell</option>
                    <option value="AUCTION" className="bg-slate-800 text-white">Auction (Open Bidding)</option>
                    <option value="REGISTRATION" className="bg-slate-800 text-white">Auction (Registration Required)</option>
                  </select>
                  {!canChangeProductType && (
                    <p className="text-white/40 text-xs mt-1">
                      Product type cannot be changed for active auctions with bids
                    </p>
                  )}
                </div>

                {/* Basic Information */}
                <div>
                  <label className="block text-white font-semibold mb-2">Title *</label>
                  <input 
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Enter product title..." 
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Description *</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={loading}
                    rows="4" 
                    placeholder="Describe your product..." 
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 resize-none focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">Category *</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50 disabled:opacity-50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-slate-800 text-white">Select category...</option>
                      <option value="Electronics" className="bg-slate-800 text-white">Electronics</option>
                      <option value="Fashion" className="bg-slate-800 text-white">Fashion</option>
                      <option value="Home & Garden" className="bg-slate-800 text-white">Home & Garden</option>
                      <option value="Sports & Fitness" className="bg-slate-800 text-white">Sports & Fitness</option>
                      <option value="Jewelry" className="bg-slate-800 text-white">Jewelry</option>
                      <option value="Collectibles" className="bg-slate-800 text-white">Collectibles</option>
                      <option value="Books" className="bg-slate-800 text-white">Books</option>
                      <option value="Toys" className="bg-slate-800 text-white">Toys</option>
                      <option value="Other" className="bg-slate-800 text-white">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">Stock *</label>
                    <input 
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      disabled={loading || formData.product_type !== 'DIRECT_SELL'}
                      min="1"
                      placeholder="Available quantity" 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                    />
                    {(formData.product_type === 'AUCTION' || formData.product_type === 'REGISTRATION') && (
                      <p className="text-white/40 text-xs mt-1">Stock is set to 1 for auctions</p>
                    )}
                  </div>
                </div>

                {/* Price - Only for Direct Sell */}
                {formData.product_type === 'DIRECT_SELL' && (
                  <div>
                    <label className="block text-white font-semibold mb-2">Price (रु) *</label>
                    <input 
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      disabled={loading}
                      step="0.01"
                      min="0.01"
                      placeholder="0.00" 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                    />
                  </div>
                )}

                {/* Auction-specific fields */}
                {(formData.product_type === 'AUCTION' || formData.product_type === 'REGISTRATION') && (
                  <>
                    <div>
                      <label className="block text-white font-semibold mb-2">Starting Bid Price (रु) *</label>
                      <input 
                        type="number"
                        name="starting_price"
                        value={formData.starting_price}
                        onChange={handleInputChange}
                        disabled={loading}
                        step="0.01"
                        min="0.01"
                        placeholder="0.00" 
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white font-semibold mb-2">Auction Start Time *</label>
                        <input 
                          type="datetime-local"
                          name="start_time"
                          value={formData.start_time}
                          onChange={handleInputChange}
                          disabled={loading}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                        />
                      </div>

                      <div>
                        <label className="block text-white font-semibold mb-2">Auction End Time *</label>
                        <input 
                          type="datetime-local"
                          name="end_time"
                          value={formData.end_time}
                          onChange={handleInputChange}
                          disabled={loading}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                        />
                      </div>
                    </div>

                    {formData.product_type === 'REGISTRATION' && (
                      <div>
                        <label className="block text-white font-semibold mb-2">Registration End Time *</label>
                        <input 
                          type="datetime-local"
                          name="registration_end"
                          value={formData.registration_end}
                          onChange={handleInputChange}
                          disabled={loading}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                        />
                        <p className="text-white/40 text-xs mt-1">Users must register before this time to participate</p>
                      </div>
                    )}
                  </>
                )}

                {/* Image Upload */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Product Images * (Max 5)
                    {isEditMode && (
                      <span className="text-white/60 text-sm ml-2">
                        • {existingImages.length} existing • {newImages.length} new
                        {deletedImageUrls.length > 0 && ` • ${deletedImageUrls.length} to delete`}
                      </span>
                    )}
                  </label>
                  <div className="space-y-4">
                    {/* Upload button */}
                    <label className="block">
                      <input 
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={loading || totalCurrentImages >= 5}
                        className="hidden"
                      />
                      <div className={`w-full px-4 py-8 bg-white/10 border-2 border-dashed border-white/20 rounded-xl hover:border-cyan-400/50 transition-colors ${loading || totalCurrentImages >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex flex-col items-center gap-2`}>
                        <ImageIcon className="w-8 h-8 text-white/40" />
                        <p className="text-white/60">
                          {totalCurrentImages >= 5 
                            ? 'Maximum images reached' 
                            : 'Click to upload images'}
                        </p>
                        <p className="text-white/40 text-xs">PNG, JPG up to 10MB each</p>
                      </div>
                    </label>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                      <div>
                        <p className="text-white/60 text-sm mb-2">Existing Images:</p>
                        <div className="grid grid-cols-5 gap-4">
                          {existingImages.map((image, index) => (
                            <div key={`existing-${index}`} className="relative group">
                              <img 
                                src={image.url} 
                                alt={`Existing ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-blue-500/50"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                disabled={loading}
                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3 text-white" />
                              </button>
                              <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-blue-500 rounded text-white text-xs">
                                Existing
                              </div>
                              {image.isPrimary && (
                                <div className="absolute top-1 left-1 px-2 py-0.5 bg-cyan-500 rounded text-white text-xs">
                                  Primary
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Images */}
                    {newImagePreviews.length > 0 && (
                      <div>
                        <p className="text-white/60 text-sm mb-2">New Images to Upload:</p>
                        <div className="grid grid-cols-5 gap-4">
                          {newImagePreviews.map((preview, index) => (
                            <div key={`new-${index}`} className="relative group">
                              <img 
                                src={preview} 
                                alt={`New ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-green-500/50"
                              />
                              <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                disabled={loading}
                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3 text-white" />
                              </button>
                              <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-green-500 rounded text-white text-xs">
                                New
                              </div>
                              {existingImages.length === 0 && index === 0 && (
                                <div className="absolute top-1 left-1 px-2 py-0.5 bg-cyan-500 rounded text-white text-xs">
                                  Primary
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-800/90 border-t border-white/20 p-6 flex gap-4 backdrop-blur-md">
                <button 
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
                >
                  <Zap className="w-5 h-5" />
                  {loading 
                    ? (isEditMode ? 'Updating...' : 'Publishing...') 
                    : (isEditMode ? 'Update Listing' : 'Publish Listing')
                  }
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CreateListingModal
import React, { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { X, Zap, Image as ImageIcon, Trash2 } from "lucide-react"
import {addProduct} from '../../services/sellerservices.js'
import toast from 'react-hot-toast'

function CreateListingModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
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
  
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    
    // Limit to 5 images
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed')
      return
    }

    setImages(prev => [...prev, ...files])
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
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

      if (!formData.stock || !formData.amount) {
        setError('Stock and amount are required')
        setLoading(false)
        return
      }

      // Validate auction fields
      if (formData.product_type === 'AUCTION' || formData.product_type === 'REGISTRATION') {
        if (!formData.starting_price || !formData.start_time || !formData.end_time) {
          setError('Starting price, start time, and end time are required for auctions')
          setLoading(false)
          return
        }
        
        if (formData.product_type === 'REGISTRATION' && !formData.registration_end) {
          setError('Registration end time is required for registration-type auctions')
          setLoading(false)
          return
        }
      }

      // Validate images
      if (images.length === 0) {
        setError('At least one product image is required')
        setLoading(false)
        return
      }

      const response = await addProduct(formData, images)
      if (response.success) {
        toast.success("Product listed successfully")
        resetForm()
        // Close modal - this will trigger refresh in parent
        onClose()
           window.location.reload();
      }

    } catch (err) {
      console.error('Error creating listing:', err)
      setError(err.response?.data?.message || 'Failed to create listing')
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
    setImages([])
    setImagePreviews([])
    setError('')
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

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
                <h2 className="text-2xl font-bold text-white">Create New Listing</h2>
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

                {/* Product Type Selection */}
                <div>
                  <label className="block text-white font-semibold mb-2">Product Type *</label>
                  <select 
                    name="product_type"
                    value={formData.product_type}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50 disabled:opacity-50"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="DIRECT_SELL" className="bg-slate-800 text-white">Direct Sell</option>
                    <option value="AUCTION" className="bg-slate-800 text-white">Auction (Open Bidding)</option>
                    <option value="REGISTRATION" className="bg-slate-800 text-white">Auction (Registration Required)</option>
                  </select>
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
                      disabled={loading}
                      min="0"
                      placeholder="Available quantity" 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                    />
                  </div>
                </div>

                {/* Price/Amount */}
                {formData.product_type === 'DIRECT_SELL' ? (
                  <div>
                    <label className="block text-white font-semibold mb-2">Price *</label>
                    <input 
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      disabled={loading}
                      step="0.01"
                      min="0"
                      placeholder="0.00" 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-white font-semibold mb-2">Buy Now Price (Optional)</label>
                    <input 
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      disabled={loading}
                      step="0.01"
                      min="0"
                      placeholder="0.00" 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 disabled:opacity-50" 
                    />
                    <p className="text-white/40 text-xs mt-1">Leave empty if auction only</p>
                  </div>
                )}

                {/* Auction-specific fields */}
                {(formData.product_type === 'AUCTION' || formData.product_type === 'REGISTRATION') && (
                  <>
                    <div>
                      <label className="block text-white font-semibold mb-2">Starting Bid Price *</label>
                      <input 
                        type="number"
                        name="starting_price"
                        value={formData.starting_price}
                        onChange={handleInputChange}
                        disabled={loading}
                        step="0.01"
                        min="0"
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
                  <label className="block text-white font-semibold mb-2">Product Images * (Max 5)</label>
                  <div className="space-y-4">
                    {/* Upload button */}
                    <label className="block">
                      <input 
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={loading}
                        className="hidden"
                      />
                      <div className={`w-full px-4 py-8 bg-white/10 border-2 border-dashed border-white/20 rounded-xl hover:border-cyan-400/50 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex flex-col items-center gap-2`}>
                        <ImageIcon className="w-8 h-8 text-white/40" />
                        <p className="text-white/60">Click to upload images</p>
                        <p className="text-white/40 text-xs">PNG, JPG up to 10MB each</p>
                      </div>
                    </label>

                    {/* Image previews */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-5 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={preview} 
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-white/20"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              disabled={loading}
                              className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-cyan-500 rounded text-white text-xs">
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
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
                  {loading ? 'Publishing...' : 'Publish Listing'}
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
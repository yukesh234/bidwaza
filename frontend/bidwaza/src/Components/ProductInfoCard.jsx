import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ShoppingBag, ChevronLeft, ChevronRight, User, Package, Clock, Tag, MoveLeft } from 'lucide-react'
import { useNavigate,NavLink } from 'react-router-dom'

function ProductInfoCard({ product, onAddToCart, onBuyNow }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const navigate = useNavigate()

  if (!product) return null

  const { 
    itemId, 
    title, 
    description, 
    category, 
    stock, 
    amount, 
    createdAt, 
    seller, 
    images = [] 
  } = product

  const sortedImages = [...images].sort((a, b) => (a?.displayOrder || 0) - (b?.displayOrder || 0))

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)
  }

  const handleSellerClick = () => {
    if (seller?.sellerId) navigate(`/sellerpage/${seller.sellerId}`)
  }

  const formatDate = (date) => {
    if (!date) return "Unknown date"
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 py-12 px-4">
          <motion.div 
        className='absolute top-6 left-6'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <NavLink
          to="/"
          className='flex items-center gap-2 text-white/80 hover:text-cyan-300 transition-all duration-300 group -mt-4' 
        >
          <MoveLeft className='h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300' />
          Back to Home
        </NavLink>
      </motion.div>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-2 gap-12"
        >
          {/* Image Gallery Section */}
          <div className="space-y-4">
            <div className="relative group">
              <div className="relative h-[500px] bg-white/5 rounded-2xl overflow-hidden border border-white/20">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={sortedImages[currentImageIndex]?.url}
                    alt={title || "Product image"}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {sortedImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}

                {sortedImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                    {currentImageIndex + 1} / {sortedImages.length}
                  </div>
                )}

                <div className="absolute top-4 left-4 px-4 py-2 bg-cyan-500/80 backdrop-blur-sm rounded-full text-white text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {category || "Uncategorized"}
                </div>
              </div>
            </div>

            {sortedImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {sortedImages.map((image, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative h-24 rounded-xl overflow-hidden border-2 transition-all ${
                      currentImageIndex === index
                        ? 'border-cyan-400 shadow-lg shadow-cyan-500/50'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <img
                      src={image?.url}
                      alt={`${title || "Product"} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {currentImageIndex === index && (
                      <div className="absolute inset-0 bg-cyan-400/20" />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">{title || "Untitled Product"}</h1>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  ₹{amount?.toLocaleString() || "0"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  stock > 0 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  <Package className="w-4 h-4" />
                  {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="w-4 h-4" />
                  Listed on {formatDate(createdAt)}
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-3">Description</h3>
              <p className="text-white/80 leading-relaxed">{description || "No description available."}</p>
            </div>

            {seller && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">Seller Information</h3>
                <button
                  onClick={handleSellerClick}
                  className="flex items-center gap-4 w-full hover:bg-white/10 p-3 rounded-xl transition-all group"
                >
                  <div className="relative">
                    {seller?.profilePicture ? (
                      <img
                        src={seller.profilePicture}
                        alt={seller.name || "Seller"}
                        className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400 group-hover:border-cyan-300 transition-all"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center border-2 border-cyan-400 group-hover:border-cyan-300 transition-all">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-800" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold text-lg group-hover:text-cyan-300 transition-colors">
                      {seller?.name || "Unknown Seller"}
                    </p>
                    <p className="text-white/60 text-sm">{seller?.email || "No email provided"}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            )}

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onBuyNow?.(product)}
                disabled={stock === 0}
                className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <ShoppingBag className="w-6 h-6" />
                Buy Now
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAddToCart?.(product)}
                disabled={stock === 0}
                className="w-full px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-3 border border-white/20 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-6 h-6" />
                Add to Cart
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Product ID</p>
                <p className="text-white font-semibold">#{itemId || "N/A"}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Category</p>
                <p className="text-white font-semibold">{category || "Uncategorized"}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProductInfoCard

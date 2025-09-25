import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/Authcontext';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Star, 
  Timer,
  Plus,
  Minus,
  X,
  User
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "MacBook Pro M3 Max",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
    currentBid: 1899,
    minBid: 1200,
    timeLeft: "2h 34m",
    totalBids: 47,
    description: "Brand new, sealed in box",
    isBidding: true,
    rating: 4.8,
    reviews: 124
  },
  {
    id: 2,
    name: "Vintage Rolex Submariner",
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&h=400&fit=crop",
    currentBid: 8450,
    minBid: 5000,
    timeLeft: "1d 4h",
    totalBids: 89,
    description: "1975 model, excellent condition",
    isBidding: true,
    rating: 4.9,
    reviews: 67
  },
  {
    id: 3,
    name: "Designer Handbag Collection",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
    price: 340,
    originalPrice: 450,
    description: "Authentic designer pieces",
    isBidding: false,
    rating: 4.7,
    reviews: 89,
    inStock: true
  },
  {
    id: 4,
    name: "Gaming Setup Bundle",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=400&fit=crop",
    currentBid: 1250,
    minBid: 800,
    timeLeft: "45m",
    totalBids: 156,
    description: "Complete gaming rig",
    isBidding: true,
    rating: 4.6,
    reviews: 203
  },
  {
    id: 5,
    name: "Antique Furniture Set",
    category: "Home",
    image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop",
    price: 890,
    originalPrice: 1200,
    description: "Victorian era dining set",
    isBidding: false,
    rating: 4.5,
    reviews: 34,
    inStock: true
  },
  {
    id: 6,
    name: "Premium Headphones",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    price: 299,
    originalPrice: 399,
    description: "Noise-cancelling wireless",
    isBidding: false,
    rating: 4.8,
    reviews: 156,
    inStock: true
  },
  {
    id: 7,
    name: "Smart Watch Series",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    currentBid: 280,
    minBid: 200,
    timeLeft: "3h 15m",
    totalBids: 23,
    description: "Latest fitness tracking",
    isBidding: true,
    rating: 4.7,
    reviews: 92
  },
  {
    id: 8,
    name: "Professional Camera Kit",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
    price: 1599,
    originalPrice: 1899,
    description: "DSLR with multiple lenses",
    isBidding: false,
    rating: 4.9,
    reviews: 78,
    inStock: true
  }
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated); // Will be managed by state management later
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [wishlist, setWishlist] = useState(new Set());
  const [bidAmounts, setBidAmounts] = useState({});

  const toggleWishlist = (productId) => {
    if (!loggedIn) {
      setShowAuthModal(true);
      return;
    }
    setWishlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleBuyNow = () => {
    if (!loggedIn) {
      setShowAuthModal(true);
    }
    // If logged in, proceed with purchase
  };

  const handlePlaceBid = (productId) => {
    if (!loggedIn) {
      setShowAuthModal(true);
      return;
    }
    // Place bid logic here
    console.log(`Placing bid for product ${productId}:`, bidAmounts[productId]);
  };

  const updateBidAmount = (productId, amount) => {
    setBidAmounts(prev => ({
      ...prev,
      [productId]: amount
    }));
  };

  const formatTimeLeft = (timeLeft) => {
    return timeLeft.split(' ').map((part, index) => (
      <span key={index} className={index % 2 === 0 ? 'font-bold text-red-400' : 'text-gray-400'}>
        {part}{index < timeLeft.split(' ').length - 1 ? ' ' : ''}
      </span>
    ));
  };

  const AuthModal = () => (
    <AnimatePresence>
      {showAuthModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAuthModal(false)}
        >
          <motion.div
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                Please Log In
              </h2>
              <p className="text-gray-400 mb-8">
                You need to be logged in to make purchases or place bids on our platform.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    // Navigate to login - will be replaced with proper routing later
                    console.log('Navigate to login page');
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    // Navigate to signup - will be replaced with proper routing later
                    console.log('Navigate to signup page');
                  }}
                  className="flex-1 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all duration-300"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <header className="py-8 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
           Bidwaza
          </motion.h1>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-12 pr-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 w-80"
              />
            </div>
            <motion.button
              className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </header>

    

      {/* Product Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h3 className="text-3xl font-bold text-white mb-4">Featured Products</h3>
            <p className="text-gray-400">Buy now or place your bids on these amazing items</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-4 right-4 z-10 p-2 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 transition-colors"
                >
                  <Heart className={`w-5 h-5 transition-colors ${
                    wishlist.has(product.id) ? 'text-red-500 fill-red-500' : 'text-white'
                  }`} />
                </button>

                {/* Badge */}
                {product.isBidding && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse">
                      Live Auction
                    </span>
                  </div>
                )}

                {/* Product Image */}
                <div className="relative overflow-hidden rounded-xl mb-4 aspect-square">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {product.isBidding && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-black/70 backdrop-blur-md rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">Ends in:</span>
                          <div className="flex items-center gap-1">
                            <Timer className="w-4 h-4 text-red-400" />
                            <span>{formatTimeLeft(product.timeLeft)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-400">{product.description}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-gray-300">{product.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500">({product.reviews} reviews)</span>
                  </div>

                  {/* Pricing */}
                  <div className="bg-white/5 rounded-xl p-4">
                    {product.isBidding ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Current Bid:</span>
                          <span className="text-xl font-bold text-white">
                            ${product.currentBid.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Min Bid: ${product.minBid}</span>
                          <span className="text-blue-400">{product.totalBids} bids</span>
                        </div>

                        {/* Bid Input */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white/10 rounded-lg border border-white/20">
                            <button
                              onClick={() => updateBidAmount(product.id, Math.max((bidAmounts[product.id] || product.currentBid + 10) - 10, product.currentBid + 1))}
                              className="p-2 hover:bg-white/20 transition-colors rounded-l-lg"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={bidAmounts[product.id] || product.currentBid + 10}
                              onChange={(e) => updateBidAmount(product.id, parseInt(e.target.value) || product.currentBid + 10)}
                              className="w-20 py-2 px-3 bg-transparent text-center text-white focus:outline-none"
                              min={product.currentBid + 1}
                            />
                            <button
                              onClick={() => updateBidAmount(product.id, (bidAmounts[product.id] || product.currentBid + 10) + 10)}
                              className="p-2 hover:bg-white/20 transition-colors rounded-r-lg"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-white">
                            ${product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-gray-500 line-through">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${product.inStock ? 'text-green-400' : 'text-red-400'}`}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {product.isBidding ? (
                      <motion.button
                        onClick={() => handlePlaceBid(product.id)}
                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Place Bid
                      </motion.button>
                    ) : (
                      <>
                        <motion.button
                          onClick={handleBuyNow}
                          className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: product.inStock ? 1.02 : 1 }}
                          whileTap={{ scale: product.inStock ? 0.98 : 1 }}
                          disabled={!product.inStock}
                        >
                          Buy Now
                        </motion.button>
                        <motion.button
                          onClick={handleBuyNow}
                          className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal />

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2025 Bidwaza. Your trusted marketplace for buying and bidding.
          </p>
        </div>
      </footer>
    </div>
  );
}
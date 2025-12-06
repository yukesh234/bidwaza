import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const FilterModal = ({ 
  showFilters, 
  setShowFilters, 
  filters, 
  setFilters, 
  applyFilters, 
  clearFilters 
}) => {
  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowFilters(false)}
        >
          <motion.div
            className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700 relative max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="" className="bg-gray-800">All Categories</option>
                  <option value="Electronics" className="bg-gray-800">Electronics</option>
                  <option value="Fashion" className="bg-gray-800">Fashion</option>
                  <option value="Home" className="bg-gray-800">Home & Garden</option>
                  <option value="Sports" className="bg-gray-800">Sports</option>
                  <option value="Books" className="bg-gray-800">Books</option>
                </select>
              </div>

              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Type
                </label>
                <select
                  value={filters.productType}
                  onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="" className="bg-gray-800">All Types</option>
                  <option value="DIRECT_SELL" className="bg-gray-800">Direct Sell</option>
                  <option value="AUCTION" className="bg-gray-800">Auction</option>
                  <option value="REGISTRATION" className="bg-gray-800">Registration</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    placeholder="Min"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    placeholder="Max"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="" className="bg-gray-800">Any Rating</option>
                  <option value="4" className="bg-gray-800">4+ Stars</option>
                  <option value="3" className="bg-gray-800">3+ Stars</option>
                  <option value="2" className="bg-gray-800">2+ Stars</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="newest" className="bg-gray-800">Newest First</option>
                  <option value="price_low" className="bg-gray-800">Price: Low to High</option>
                  <option value="price_high" className="bg-gray-800">Price: High to Low</option>
                  <option value="rating" className="bg-gray-800">Highest Rated</option>
                  <option value="popular" className="bg-gray-800">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-medium shadow-lg"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
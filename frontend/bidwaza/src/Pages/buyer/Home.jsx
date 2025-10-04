import React, { useState, useEffect } from "react";
import { useAuth } from "../../Context/Authcontext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, X, User } from "lucide-react";
import api from "../../API/api.js";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../Components/Cards.jsx"; // Import the new component

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // === Fetch Products (Axios) ===
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/user/getProducts?page=${page}&limit=8`);
      if (data.success) {
        setProducts(data.data.products || []);
        setPagination(data.data.pagination);
      } else {
        console.error("Failed to fetch products:", data.message);
      }
    } catch (err) {
      console.error("Error fetching products:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(pagination.currentPage);
  }, [pagination.currentPage]);

  // === Pagination ===
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  // === Handle Buy Click ===
  const handleBuyClick = (product) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      // Navigate to product detail or checkout
      console.log('Buying:', product);
      navigate(`/product/${product.itemId}`);
    }
  };

  // === Auth Modal ===
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
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Please Log In</h2>
              <p className="text-gray-400 mb-8">
                You need to log in to make purchases or bids.
              </p>
              <div className="flex gap-4">
                <button
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600"
                  onClick={() => navigate('/login')}
                >
                  Login
                </button>
                <button
                  className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
                  onClick={() => navigate('/signup')}
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

  // === Pagination Component ===
  const PaginationControls = () => (
    <div className="flex justify-center items-center gap-3 mt-12">
      <button
        disabled={!pagination.hasPrevPage}
        onClick={() => handlePageChange(pagination.currentPage - 1)}
        className={`px-4 py-2 rounded-lg border border-white/20 ${
          pagination.hasPrevPage
            ? "hover:bg-white/10 text-white"
            : "opacity-50 cursor-not-allowed text-gray-500"
        }`}
      >
        Prev
      </button>

      <div className="flex gap-2">
        {Array.from({ length: pagination.totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => handlePageChange(i + 1)}
            className={`px-3 py-1 rounded-lg ${
              pagination.currentPage === i + 1
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button
        disabled={!pagination.hasNextPage}
        onClick={() => handlePageChange(pagination.currentPage + 1)}
        className={`px-4 py-2 rounded-lg border border-white/20 ${
          pagination.hasNextPage
            ? "hover:bg-white/10 text-white"
            : "opacity-50 cursor-not-allowed text-gray-500"
        }`}
      >
        Next
      </button>
    </div>
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
          >
            Bidwaza
          </motion.h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-12 pr-6 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 w-80"
              />
            </div>
            <motion.button
              className="p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Product Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-white mb-6">Featured Products</h3>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No products found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.itemId}
                    product={product}
                    onBuyClick={handleBuyClick}
                  />
                ))}
              </div>

              <PaginationControls />
            </>
          )}
        </div>
      </section>

      <AuthModal />

      <footer className="py-12 px-6 border-t border-white/10 mt-20 text-center text-gray-400">
        © 2025 Bidwaza. Your trusted marketplace for buying and bidding.
      </footer>
    </div>
  );
}
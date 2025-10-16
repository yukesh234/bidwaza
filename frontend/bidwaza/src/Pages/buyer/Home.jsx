import React, { useState, useEffect } from "react";
import { useAuth } from "../../Context/Authcontext";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Gavel, DollarSign } from "lucide-react";
import api from "../../API/api.js";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../Components/Cards.jsx";
import { addtocart } from '../../services/userservices.js';
import toast from "react-hot-toast";
import { usePayment } from '../../hooks/usePayment.js';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 8
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { handleBuyNow } = usePayment();

  // === Fetch Products ===
  const fetchProducts = async (page) => {
    setLoading(true);
    try {
      console.log(`Fetching products for page ${page}...`);
      
      const response = await api.get(`/user/getProducts?page=${page}&limit=8`);
      
     
      if(response.data.success)
      {
         console.log("API Response:", response.data);
      }

      if (response.data.success) {
        setProducts(response.data.data.products || []);
        setPagination(response.data.data.pagination);
        
        console.log("Products loaded:", response.data.data.products.length);
        console.log("Pagination:", response.data.data.pagination);
      } else {
        console.error("Failed to fetch products:", response.data.message);
        toast.error("Failed to load products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when page changes
  useEffect(() => {
    console.log("Page changed to:", currentPage);
    fetchProducts(currentPage);
  }, [currentPage]);

  // === Pagination Handler ===
  const handlePageChange = (newPage) => {
    console.log("handlePageChange called with:", newPage);
    console.log("Current page:", currentPage);
    console.log("Total pages:", pagination.totalPages);
    
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== currentPage) {
      console.log("Setting page to:", newPage);
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log("Page change blocked");
    }
  };

  // === Add to Cart ===
  const onAddToCart = async (product) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      try {
        const response = await addtocart(product.itemId);
        if (response.success) {
          toast.success(response.message);
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        console.error("Add to cart error:", error);
        toast.error("Failed to add to cart");
      }
    }
  };

  // === Bid Handler ===
  const handleBidClick = (product) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setSelectedProduct(product);
      // Set minimum bid amount (current price + 1 or starting price)
      const minBid = product.currentPrice 
        ? product.currentPrice + 1 
        : product.startingPrice + 1;
      setBidAmount(minBid.toString());
      setShowBidModal(true);
    }
  };

  // === Submit Bid ===
  const handleSubmitBid = async () => {
    if (!selectedProduct || !bidAmount) return;

    const minBid = selectedProduct.currentPrice 
      ? selectedProduct.currentPrice + 1 
      : selectedProduct.startingPrice;

    if (parseFloat(bidAmount) < minBid) {
      toast.error(`Bid must be at least ₹${minBid.toLocaleString()}`);
      return;
    }

    try {
      // Call your bid API endpoint here
      const response = await api.post(`/user/placeBid`, {
        itemId: selectedProduct.itemId,
        bidAmount: parseFloat(bidAmount)
      });

      if (response.data.success) {
        toast.success("Bid placed successfully!");
        setShowBidModal(false);
        setBidAmount("");
        setSelectedProduct(null);
        // Refresh products to show updated bid
        fetchProducts(currentPage);
      } else {
        toast.error(response.data.message || "Failed to place bid");
      }
    } catch (error) {
      console.error("Bid error:", error);
      toast.error("Failed to place bid");
    }
  };

  // === Registration Handler ===
  const handleRegisterClick = async (product) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      try {
        // Call your registration API endpoint here
        const response = await api.post(`/user/registerForProduct`, {
          itemId: product.itemId
        });

        if (response.data.success) {
          toast.success("Registration successful!");
          // You might want to navigate to payment or show registration confirmation
          // For now, using the payment flow with registration fee
          handleBuyNow(product, 1, product.amount);
        } else {
          toast.error(response.data.message || "Failed to register");
        }
      } catch (error) {
        console.error("Registration error:", error);
        toast.error("Failed to register for product");
      }
    }
  };

  // === Product Click Handler ===
  const handleclick = (itemId) => {
    navigate(`/productinfo/${itemId}`);
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
                You need to log in to make purchases, place bids, or register for products.
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

  // === Bid Modal ===
  const BidModal = () => (
    <AnimatePresence>
      {showBidModal && selectedProduct && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowBidModal(false)}
        >
          <motion.div
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-orange-500/50 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowBidModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gavel className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Place Your Bid</h2>
              <p className="text-gray-400 mb-6">{selectedProduct.title}</p>
              
              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Starting Price:</span>
                  <span className="text-white font-semibold">
                    ₹{selectedProduct.startingPrice?.toLocaleString()}
                  </span>
                </div>
                {selectedProduct.currentPrice && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Current Bid:</span>
                    <span className="text-green-400 font-semibold">
                      ₹{selectedProduct.currentPrice?.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-gray-400 text-sm">Minimum Bid:</span>
                  <span className="text-orange-400 font-semibold">
                    ₹{(selectedProduct.currentPrice 
                      ? selectedProduct.currentPrice + 1 
                      : selectedProduct.startingPrice + 1
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-left text-gray-400 text-sm mb-2">
                  Your Bid Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={selectedProduct.currentPrice 
                      ? selectedProduct.currentPrice + 1 
                      : selectedProduct.startingPrice + 1}
                    step="1"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Enter bid amount"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  onClick={() => setShowBidModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-colors"
                  onClick={handleSubmitBid}
                >
                  Place Bid
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // === Pagination Component ===
  const PaginationControls = () => {
    const getPageNumbers = () => {
      const pages = [];
      const totalPages = pagination.totalPages;
      
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, currentPage + 2);
        
        if (currentPage <= 3) {
          end = 5;
        } else if (currentPage >= totalPages - 2) {
          start = totalPages - 4;
        }
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex justify-center items-center gap-3 mt-12 relative z-20">
        <button
          disabled={!pagination.hasPrevPage}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePageChange(currentPage - 1);
          }}
          className={`px-4 py-2 rounded-lg border border-white/20 transition-colors ${
            pagination.hasPrevPage
              ? "hover:bg-white/10 text-white cursor-pointer"
              : "opacity-50 cursor-not-allowed text-gray-500"
          }`}
        >
          Prev
        </button>

        <div className="flex gap-2">
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePageChange(pageNum);
              }}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                currentPage === pageNum
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          disabled={!pagination.hasNextPage}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePageChange(currentPage + 1);
          }}
          className={`px-4 py-2 rounded-lg border border-white/20 transition-colors ${
            pagination.hasNextPage
              ? "hover:bg-white/10 text-white cursor-pointer"
              : "opacity-50 cursor-not-allowed text-gray-500"
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Product Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-3xl font-bold text-white">Featured Products</h3>
            <p className="text-gray-400">
              Page {currentPage} of {pagination.totalPages} ({pagination.totalCount} total products)
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-xl">No products found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 relative z-0">
                {products.map((product) => (
                  <ProductCard
                    key={product.itemId}
                    product={product}
                    onBuyClick={handleBuyNow}
                    onAddToCart={onAddToCart}
                    onClick={handleclick}
                    onBidClick={handleBidClick}
                    onRegisterClick={handleRegisterClick}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && <PaginationControls />}
            </>
          )}
        </div>
      </section>

      <AuthModal />
      <BidModal />

      <footer className="py-12 px-6 border-t border-white/10 mt-20 text-center text-gray-400">
        © 2025 Bidwaza. Your trusted marketplace for buying and bidding.
      </footer>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useAuth } from "../../Context/Authcontext";
import { useSocket } from "../../Context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, SlidersHorizontal } from "lucide-react";
import api from "../../API/api.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../../Components/Cards.jsx";
import { addtocart } from "../../services/userservices.js";
import toast from "react-hot-toast";
import { usePayment } from "../../hooks/usePayment.js";
import BidModal from "../../Components/buyer/BidModal.jsx";
import FilterModal from "../../Components/buyer/FilterModal.jsx";

export default function Home() {
  const { isAuthenticated, user, balance } = useAuth();
  const { socket, connected, joinAuction, leaveAuction } = useSocket();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [products, setProducts] = useState([]);
  const [registeredProducts, setRegisteredProducts] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 8,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { handleBuyNow } = usePayment();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    productType: searchParams.get('product_type') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    sortBy: searchParams.get('sortBy') || 'newest'
  });

  // Check registration status for a single product
  const checkRegistrationStatus = async (itemId) => {
    if (!isAuthenticated) return false;
    
    try {
      const response = await api.get(`/auction/checkRegistration/${itemId}`);
      return response.data.registered || false;
    } catch (error) {
      console.error("Failed to check registration:", error);
      return false;
    }
  };

  // Fetch Products with filters and check registration status
const fetchProducts = async (page) => {
  setLoading(true);
  try {
    const search = searchParams.get('search') || '';
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '8',
    });

    // Add search if present
    if (search) params.append('search', search);
    
    // Add filters if present
    if (filters.category) params.append('category', filters.category);
    if (filters.productType) params.append('product_type', filters.productType);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const response = await api.get(`/user/getProducts?${params.toString()}`);

    if (response.data.success) {
      const fetchedProducts = response.data.data.products || [];
      setProducts(fetchedProducts);
      setPagination(response.data.data.pagination);
      
      // No need to check registration status anymore - it's included in the response!
    } else {
      toast.error("Failed to load products");
    }
  } catch (err) {
    console.error('Fetch error:', err);
    toast.error("Error loading products");
  } finally {
    setLoading(false);
  }
};




  // Fetch products when page or searchParams change
  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, searchParams, filters]);

  // Sync filters with URL params when URL changes
  useEffect(() => {
    const newFilters = {
      category: searchParams.get('category') || '',
      productType: searchParams.get('product_type') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      minRating: searchParams.get('minRating') || '',
      sortBy: searchParams.get('sortBy') || 'newest'
    };
    
    setFilters(newFilters);
  }, [searchParams]);

  // Reset page when search changes
  const [prevSearch, setPrevSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const search = searchParams.get('search') || '';
    if (search !== prevSearch) {
      setCurrentPage(1);
      setPrevSearch(search);
    }
  }, [searchParams, prevSearch]);

  // Join auction rooms for displayed products
  useEffect(() => {
    if (connected && products.length > 0) {
      products.forEach(product => {
        if (product.productType === 'AUCTION' || product.productType === 'REGISTRATION') {
          joinAuction(product.itemId);
        }
      });
    }

    return () => {
      if (connected && products.length > 0) {
        products.forEach(product => {
          if (product.productType === 'AUCTION' || product.productType === 'REGISTRATION') {
            leaveAuction(product.itemId);
          }
        });
      }
    };
  }, [connected, products, joinAuction, leaveAuction]);

  // Listen for real-time bid updates
  useEffect(() => {
    if (!socket) return;

    const handleBidUpdate = (data) => {
      console.log('Bid update received:', data);
      
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.itemId === data.itemId
            ? {
                ...product,
                auctionDetails: {
                  ...product.auctionDetails,
                  currentPrice: data.currentPrice
                }
              }
            : product
        )
      );

      if (data.bidderId !== user?.id) {
        toast(`New bid: रु${data.bidAmount.toLocaleString()} by ${data.bidderName}`, {
          icon: '📢',
          duration: 3000
        });
      }
    };

    socket.on('bid-update', handleBidUpdate);

    return () => {
      socket.off('bid-update', handleBidUpdate);
    };
  }, [socket, user]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onAddToCart = async (product) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      const response = await addtocart(product.itemId);
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleBidClick = (product) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setSelectedProduct(product);
    const currentPrice =
      product.auctionDetails?.currentPrice || product.auctionDetails?.startingPrice;
    const minBid = currentPrice ? currentPrice + 1 : 1;
    setBidAmount(minBid.toString());
    setShowBidModal(true);
  };

  const handleSubmitBid = async () => {
    if (!selectedProduct || !bidAmount) return;

    const currentPrice =
      selectedProduct.auctionDetails?.currentPrice ||
      selectedProduct.auctionDetails?.startingPrice;
    const minBid = currentPrice ? currentPrice + 1 : 1;

    if (parseFloat(bidAmount) < minBid) {
      toast.error(`Bid must be at least रु${minBid.toLocaleString()}`);
      return;
    }

    if (balance?.balance < parseFloat(bidAmount)) {
      toast.error(`Insufficient balance. Available: रु${balance?.balance?.toLocaleString() || 0}`);
      return;
    }

    try {
      const response = await api.post(`/auction/placeBid`, {
        itemId: selectedProduct.itemId,
        bidAmount: parseFloat(bidAmount),
      });

      if (response.data.success) {
        toast.success("Bid placed successfully!");
        setShowBidModal(false);
        setBidAmount("");
        setSelectedProduct(null);
      } else {
        toast.error(response.data.message || "Failed to place bid");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place bid");
    }
  };

  const handleRegisterClick = async (product) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }
    
    try {
      const response = await api.post(`/auction/registerForProduct`, {
        itemId: product.itemId,
      });

      if (response.data.success) {
        toast.success("Registration successful!");
        
        // Update the registered products set
        setRegisteredProducts(prev => new Set([...prev, product.itemId]));
        
        return true;
      } else {
        // Check if already registered
        if (response.data.message?.toLowerCase().includes('already registered')) {
          toast.error("You're already registered for this auction");
          // Update state to reflect registration
          setRegisteredProducts(prev => new Set([...prev, product.itemId]));
        } else {
          toast.error(response.data.message || "Failed to register");
        }
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to register for product";
      
      // Check if already registered
      if (errorMessage.toLowerCase().includes('already registered')) {
        toast.error("You're already registered for this auction");
        // Update state to reflect registration
        setRegisteredProducts(prev => new Set([...prev, product.itemId]));
      } else {
        toast.error(errorMessage);
      }
      return false;
    }
  };

  const handleclick = (itemId) => navigate(`/productinfo/${itemId}`);

  // Apply filters - UPDATE URL WITH FILTER PARAMS
  const applyFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    
    // Keep search if it exists
    const currentSearch = searchParams.get('search');
    if (currentSearch) {
      newParams.set('search', currentSearch);
    }
    
    // Update or remove filter params
    if (filters.category) {
      newParams.set('category', filters.category);
    } else {
      newParams.delete('category');
    }
    
    if (filters.productType) {
      newParams.set('product_type', filters.productType);
    } else {
      newParams.delete('product_type');
    }
    
    if (filters.minPrice) {
      newParams.set('minPrice', filters.minPrice);
    } else {
      newParams.delete('minPrice');
    }
    
    if (filters.maxPrice) {
      newParams.set('maxPrice', filters.maxPrice);
    } else {
      newParams.delete('maxPrice');
    }
    
    if (filters.minRating) {
      newParams.set('minRating', filters.minRating);
    } else {
      newParams.delete('minRating');
    }
    
    if (filters.sortBy && filters.sortBy !== 'newest') {
      newParams.set('sortBy', filters.sortBy);
    } else {
      newParams.delete('sortBy');
    }
    
    // Update URL with new params
    setSearchParams(newParams);
    setCurrentPage(1);
    setShowFilters(false);
  };

  // Clear filters - REMOVE ALL FILTER PARAMS FROM URL
  const clearFilters = () => {
    const newParams = new URLSearchParams();
    
    // Keep only search if it exists
    const currentSearch = searchParams.get('search');
    if (currentSearch) {
      newParams.set('search', currentSearch);
    }
    
    setFilters({
      category: '',
      productType: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sortBy: 'newest'
    });
    
    setSearchParams(newParams);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const AuthModal = () => (
    <AnimatePresence>
      {showAuthModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
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
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
                <button
                  className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
                  onClick={() => navigate("/signup")}
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

  const PaginationControls = () => {
    const getPageNumbers = () => {
      const pages = [];
      const totalPages = pagination.totalPages;
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, currentPage + 2);
        if (currentPage <= 3) end = 5;
        else if (currentPage >= totalPages - 2) start = totalPages - 4;
        for (let i = start; i <= end; i++) pages.push(i);
      }
      return pages;
    };

    return (
      <div className="flex justify-center items-center gap-3 mt-12 relative z-10">
        <button
          disabled={!pagination.hasPrevPage}
          onClick={() => handlePageChange(currentPage - 1)}
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
              onClick={() => handlePageChange(pageNum)}
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
          onClick={() => handlePageChange(currentPage + 1)}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pt-24">
      {/* Socket Connection Status */}
      {isAuthenticated && (
        <div className="fixed top-20 right-4 z-[100]">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm ${
            connected ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} ${connected ? 'animate-pulse' : ''}`} />
            <span className="text-xs text-white font-medium">
              {connected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
      )}

      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-3xl font-bold text-white">
                {searchParams.get('search') ? `Search Results for "${searchParams.get('search')}"` : 'Featured Products'}
              </h3>
              <p className="text-gray-400 mt-2">
                Page {currentPage} of {pagination.totalPages} ({pagination.totalCount} total products)
              </p>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 z-10"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="font-medium">Filters</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-xl">No products found.</p>
              {(searchParams.get('search') || Object.values(filters).some(v => v && v !== 'newest')) && (
                <button
                  onClick={() => {
                    navigate('/');
                    clearFilters();
                  }}
                  className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {products.map((product) => (
                              <ProductCard
                key={product.itemId}
                product={product}
                onBuyClick={handleBuyNow}
                onAddToCart={onAddToCart}
                onClick={handleclick}
                onBidClick={handleBidClick}
                onRegisterClick={handleRegisterClick}
                isUserRegistered={product.isUserRegistered} // Changed from registeredProducts.has(product.itemId)
              />

                ))}
              </div>
              {pagination.totalPages > 1 && <PaginationControls />}
            </>
          )}
        </div>
      </section>

      <AuthModal />
      
      <FilterModal
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        setFilters={setFilters}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
      />

      <BidModal
        show={showBidModal}
        product={selectedProduct}
        bidAmount={bidAmount}
        setBidAmount={setBidAmount}
        onClose={() => setShowBidModal(false)}
        onSubmit={handleSubmitBid}
      />

      <footer className="py-12 px-6 border-t border-white/10 mt-20 text-center text-gray-400">
        © 2025 Bidwaza. Your trusted marketplace for buying and bidding.
      </footer>
    </div>
  );
}
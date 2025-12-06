import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from "../../services/userservices.js";
import ProductInfoCard from '../../Components/ProductInfoCard';
import { onAddToCart as handleCartclick } from '../../utils/product.js';
import { usePayment } from '../../hooks/usePayment.js';
import { useAuth } from "../../Context/Authcontext";
import api from "../../API/api.js";
import toast from "react-hot-toast";
import BidModal from "../../Components/buyer/BidModal.jsx";

function Productinfo() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { handleBuyNow } = usePayment();
  const { isAuthenticated, balance } = useAuth();
  
  console.log(product);
  // Bid modal state
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");

  const onAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    handleCartclick(product);
  };

  // Handle Bid Click
  const handleBidClick = (product) => {
    if (!isAuthenticated) {
      toast.error("Please login to place bids");
      navigate("/login");
      return;
    }

    const currentPrice =
      product.auctionDetails?.currentPrice || product.auctionDetails?.startingPrice;
    const minBid = currentPrice ? currentPrice + 1 : 1;
    setBidAmount(minBid.toString());
    setShowBidModal(true);
  };

  // Submit Bid
  const handleSubmitBid = async () => {
    if (!product || !bidAmount) return;

    const currentPrice =
      product.auctionDetails?.currentPrice ||
      product.auctionDetails?.startingPrice;
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
        itemId: product.itemId,
        bidAmount: parseFloat(bidAmount),
      });

      if (response.data.success) {
        toast.success("Bid placed successfully!");
        setShowBidModal(false);
        setBidAmount("");
        // Refresh product data
        fetchProduct();
      } else {
        toast.error(response.data.message || "Failed to place bid");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place bid");
    }
  };

  // Handle Register Click
  const handleRegisterClick = async (product) => {
    if (!isAuthenticated) {
      toast.error("Please login to register");
      navigate("/login");
      return;
    }

    try {
      const response = await api.post(`/auction/registerForProduct`, {
        itemId: product.itemId,
      });

      if (response.data.success) {
        toast.success("Registration successful!");
        
        // Update the product state to reflect registration
        setProduct(prevProduct => ({
          ...prevProduct,
          isUserRegistered: true
        }));
      } else {
        // Check if already registered
        if (response.data.message?.toLowerCase().includes('already registered')) {
          toast.error("You're already registered for this auction");
          // Update state to reflect registration
          setProduct(prevProduct => ({
            ...prevProduct,
            isUserRegistered: true
          }));
        } else {
          toast.error(response.data.message || "Failed to register");
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to register for product";
      
      // Check if already registered
      if (errorMessage.toLowerCase().includes('already registered')) {
        toast.error("You're already registered for this auction");
        // Update state to reflect registration
        setProduct(prevProduct => ({
          ...prevProduct,
          isUserRegistered: true
        }));
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await getProductById(Number(itemId));
      console.log("productData", res);
      if (res?.success) {
        setProduct(res?.data || null);
      } else {
        setProduct(null);
        toast.error("Product not found");
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setProduct(null);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [itemId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white mt-4">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Product not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProductInfoCard
        product={product}
        onAddToCart={onAddToCart}
        onBuyNow={handleBuyNow}
        onBidClick={handleBidClick}
        onRegisterClick={handleRegisterClick}
        isUserRegistered={product.isUserRegistered}
      />

      {/* Bid Modal */}
      <BidModal
        show={showBidModal}
        product={product}
        bidAmount={bidAmount}
        setBidAmount={setBidAmount}
        onClose={() => setShowBidModal(false)}
        onSubmit={handleSubmitBid}
      />
    </div>
  );
}

export default Productinfo;
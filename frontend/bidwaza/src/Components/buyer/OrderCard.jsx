import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  CreditCard, 
  ShoppingBag,
  User,
  CheckCircle,
  Star,
  Send,
  Edit3,
  Sparkles,
  Trash2
} from 'lucide-react';
import reacthottoast, { toast } from 'react-hot-toast';
import {submitReview_Rating} from '../../services/userservices.js'
const OrderCard = ({ order, onReviewUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeRatingItem, setActiveRatingItem] = useState(null);
  const [ratings, setRatings] = useState({});
  const [reviews, setReviews] = useState({});
  const [hoverRatings, setHoverRatings] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!order) return null;

  const {
    orderId,
    orderNumber,
    totalAmount,
    orderStatus,
    paymentStatus,
    esewaTxnId,
    orderDate,
    items = [],
    itemCount
  } = order;

  const isCompleted = orderStatus?.toUpperCase() === 'COMPLETED';


  // Initialize ratings and reviews from existing data
  useEffect(() => {
    const existingRatings = {};
    const existingReviews = {};
    
    items.forEach(item => {
      if (item.review) {
        existingRatings[item.orderItemId] = item.review.rating;
        existingReviews[item.orderItemId] = item.review.reviewText || '';
      }
    });
    
    setRatings(existingRatings);
    setReviews(existingReviews);
  }, [items]);

  const formatDate = (date) => {
    if (!date) return "Unknown date";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status, isPaymentStatus = false) => {
    if (isPaymentStatus) {
      switch (status?.toUpperCase()) {
        case 'PAID':
          return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-300';
        case 'FAILED':
          return 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-300';
        default:
          return 'from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-300';
      }
    }
    
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-300';
      case 'PENDING':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-300';
      case 'CANCELLED':
        return 'from-red-500/20 to-pink-500/20 border-red-500/30 text-red-300';
      default:
        return 'from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-300';
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const handleRatingClick = (itemId, ratingValue) => {
    setRatings(prev => ({ ...prev, [itemId]: ratingValue }));
  };

  // Submit or update review
  const handleReviewSubmit = async (item) => {
    const rating = ratings[item.orderItemId];
    const reviewText = reviews[item.orderItemId];

    if (!rating) {
      // alert('Please select a rating before submitting!');
      toast.error('Please select a rating before submitting!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call your API service here
      // const response = await fetch('/api/reviews', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({
      //     orderItemId: item.orderItemId,
      //     productId: item.productId,
      //     rating,
      //     reviewText: reviewText || null
      //   })}
      // );
      const response = await submitReview_Rating(
        item.orderItemId,
        item.productId,
        rating,
        reviewText || null
      )
     

      if (response.success) {
        toast.success(response.message || 'Thank you for your review! 🌟');
        setActiveRatingItem(null);
        
        // Call parent callback to refresh orders
        if (onReviewUpdate) {
          onReviewUpdate();
        }
      } else {
        toast.error(response.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ itemId, currentRating, readOnly = false }) => {
    const displayRating = hoverRatings[itemId] || currentRating || 0;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileHover={!readOnly ? { scale: 1.15 } : {}}
            whileTap={!readOnly ? { scale: 0.95 } : {}}
            onMouseEnter={() => !readOnly && setHoverRatings(prev => ({ ...prev, [itemId]: star }))}
            onMouseLeave={() => !readOnly && setHoverRatings(prev => ({ ...prev, [itemId]: 0 }))}
            onClick={() => !readOnly && handleRatingClick(itemId, star)}
            disabled={readOnly}
            className={`focus:outline-none transition-transform ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <Star
              className={`w-7 h-7 transition-all ${
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                  : 'text-white/20 hover:text-white/40'
              }`}
            />
          </motion.button>
        ))}
        {currentRating > 0 && (
          <span className="ml-2 text-sm font-semibold text-yellow-400">
            {currentRating} / 5
          </span>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
        {/* Header Section */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{orderNumber}</h3>
                  <p className="text-sm text-white/60">Order ID: #{orderId}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border bg-gradient-to-r ${getStatusColor(orderStatus)} flex items-center gap-1.5`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {orderStatus}
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border bg-gradient-to-r ${getStatusColor(paymentStatus, true)}`}>
                  {paymentStatus}
                </div>
                {isCompleted && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsExpanded(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 flex items-center gap-1.5 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-500/50 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Rate Products
                  </motion.button>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-white/60 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                रु{totalAmount?.toLocaleString()}
              </p>
              <p className="text-xs text-white/40 mt-1">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>{formatDate(orderDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>TXN: {esewaTxnId}</span>
            </div>
          </div>

          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>{isExpanded ? 'Hide' : 'View'} Order Details</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Expanded Items Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/10 bg-white/5">
                <div className="p-6 space-y-4">
                  <h4 className="text-sm font-bold text-white/80 uppercase tracking-wide mb-3">
                    Order Items
                  </h4>

                  {items.map((item, index) => (
                    <motion.div
                      key={item.orderItemId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <img
                            src={item.primaryImage}
                            alt={item.productTitle}
                            className="w-20 h-20 rounded-lg object-cover border border-white/20"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="text-white font-semibold mb-1 truncate">
                            {item.productTitle}
                          </h5>
                          
                          <div className="flex items-center gap-4 text-sm text-white/60 mb-2">
                            <span>Qty: {item.quantity}</span>
                            <span>रु{item.priceAtPurchase?.toLocaleString()} each</span>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <div className="relative w-6 h-6 rounded-full overflow-hidden ring-1 ring-cyan-500/50">
                              {item.seller?.profilePicture ? (
                                <img
                                  src={item.seller.profilePicture}
                                  alt={item.seller.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-semibold">
                                  {getInitials(item.seller?.name)}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <User className="w-3 h-3 text-white/40" />
                              <span className="text-white/70">{item.seller?.name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-white/50 mb-1">Subtotal</p>
                          <p className="text-xl font-bold text-white">
                            रु{item.subtotal?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Rating Section */}
                      {isCompleted && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t border-white/10"
                        >
                          {item.review && activeRatingItem !== item.orderItemId ? (
                            // Show existing review
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h6 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                                  <Star className="w-4 h-4 text-yellow-400" />
                                  Your Review
                                </h6>
                                <button
                                  onClick={() => setActiveRatingItem(item.orderItemId)}
                                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Edit
                                </button>
                              </div>
                              
                              <StarRating 
                                itemId={item.orderItemId} 
                                currentRating={item.review.rating}
                                readOnly={true}
                              />
                              
                              {item.review.reviewText && (
                                <p className="text-sm text-white/70 bg-white/5 rounded-lg p-3">
                                  {item.review.reviewText}
                                </p>
                              )}
                              
                              <p className="text-xs text-white/40">
                                Reviewed on {formatDate(item.review.createdAt)}
                              </p>
                            </div>
                          ) : activeRatingItem === item.orderItemId ? (
                            // Edit/Add review form
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                <h6 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                                  <Star className="w-4 h-4 text-yellow-400" />
                                  {item.review ? 'Update your review' : 'Rate this product'}
                                </h6>
                                <button
                                  onClick={() => setActiveRatingItem(null)}
                                  className="text-xs text-white/50 hover:text-white/80 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>

                              <StarRating 
                                itemId={item.orderItemId} 
                                currentRating={ratings[item.orderItemId]} 
                              />

                              <textarea
                                placeholder="Share your experience with this product... (optional)"
                                value={reviews[item.orderItemId] || ''}
                                onChange={(e) => setReviews(prev => ({ 
                                  ...prev, 
                                  [item.orderItemId]: e.target.value 
                                }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                                rows="3"
                              />

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleReviewSubmit(item)}
                                disabled={isSubmitting}
                                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="w-4 h-4" />
                                {isSubmitting ? 'Submitting...' : (item.review ? 'Update Review' : 'Submit Review')}
                              </motion.button>
                            </motion.div>
                          ) : (
                            // Rate button
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setActiveRatingItem(item.orderItemId)}
                              className="w-full py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                              <Star className="w-4 h-4" />
                              Rate this Product
                              <Sparkles className="w-4 h-4" />
                            </motion.button>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default OrderCard;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, User, CheckCircle, Calendar } from 'lucide-react';

const ProductReviews = ({ reviews = [], ratingStats = {} }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
        <Star className="w-12 h-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);
  const { totalReviews = 0, averageRating = 0, ratingDistribution = {} } = ratingStats;

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-600 text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingPercentage = (starCount) => {
    if (totalReviews === 0) return 0;
    const count = ratingDistribution[starCount] || 0;
    return Math.round((count / totalReviews) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-2xl font-bold text-white mb-6">Customer Reviews</h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-white/60 text-sm">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const percentage = getRatingPercentage(star);
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-white/80 text-sm w-8">{star} ★</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: star * 0.1 }}
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                    />
                  </div>
                  <span className="text-white/60 text-sm w-12 text-right">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {displayedReviews.map((review, index) => (
          <motion.div
            key={review.reviewId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Reviewer Avatar */}
              <div className="flex-shrink-0">
                {review.reviewer?.profilePicture ? (
                  <img
                    src={review.reviewer.profilePicture}
                    alt={review.reviewer.name || 'Reviewer'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center border-2 border-cyan-400">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              {/* Review Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold">
                        {review.reviewer?.name || 'Anonymous'}
                      </h4>
                      {review.verifiedPurchase && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/50 rounded-full">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-300 font-medium">
                            Verified Purchase
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating)}
                      <div className="flex items-center gap-1 text-white/40 text-xs">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {review.reviewText && (
                  <p className="text-white/80 leading-relaxed mt-3">
                    {review.reviewText}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Show More Button */}
      {reviews.length > 3 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400/50 text-white rounded-xl transition-all font-medium"
          >
            {showAll ? 'Show Less' : `Show All ${reviews.length} Reviews`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
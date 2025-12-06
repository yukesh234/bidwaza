import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, ShoppingBag, ShoppingCart, Clock, Gavel, UserPlus, Timer, Star } from "lucide-react";

const ProductCard = ({ product, onBuyClick, onAddToCart, onClick: onProductClick, onBidClick, onRegisterClick, isUserRegistered = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [auctionStatus, setAuctionStatus] = useState('upcoming');
  const [isRegistered, setIsRegistered] = useState(isUserRegistered);

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    "/placeholder.png";

  const formattedDate = new Date(product.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

  // Render star rating
  const renderStars = () => {
    if (!product.rating?.average) return null;
    
    const rating = product.rating.average;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
        <div className="flex items-center">
          {[...Array(fullStars)].map((_, i) => (
            <Star key={`full-${i}`} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          ))}
          {hasHalfStar && (
            <div className="relative">
              <Star className="w-3 h-3 text-yellow-400" />
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <Star key={`empty-${i}`} className="w-3 h-3 text-gray-400" />
          ))}
        </div>
        <span className="text-xs text-yellow-400 font-semibold ml-1">
          {rating.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400">
          ({product.rating.count})
        </span>
      </div>
    );
  };

  // Update isRegistered when prop changes
  useEffect(() => {
    setIsRegistered(isUserRegistered);
  }, [isUserRegistered]);

  useEffect(() => {
    if (product.productType === 'AUCTION' || product.productType === 'REGISTRATION') {
      const calculateTime = () => {
        const now = new Date().getTime();

        if (product.productType === 'AUCTION') {
          const startTime = new Date(product.auctionDetails?.startTime).getTime();
          const endTime = new Date(product.auctionDetails?.endTime).getTime();

          if (now < startTime) {
            setAuctionStatus('upcoming');
            updateTimeLeft(startTime - now);
          } else if (now >= startTime && now < endTime) {
            setAuctionStatus('live');
            updateTimeLeft(endTime - now);
          } else {
            setAuctionStatus('ended');
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          }
        } else if (product.productType === 'REGISTRATION') {
          const registrationEnd = new Date(product.auctionDetails?.registrationEnd).getTime();
          const startTime = new Date(product.auctionDetails?.startTime).getTime();
          const endTime = new Date(product.auctionDetails?.endTime).getTime();

          if (now < registrationEnd) {
            setAuctionStatus('registration_open');
            updateTimeLeft(registrationEnd - now);
          } else if (now < startTime) {
            setAuctionStatus('registration_closed');
            updateTimeLeft(startTime - now);
          } else if (now >= startTime && now < endTime) {
            setAuctionStatus('live');
            updateTimeLeft(endTime - now);
          } else {
            setAuctionStatus('ended');
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          }
        }
      };

      const updateTimeLeft = (distance) => {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      };

      calculateTime();
      const interval = setInterval(calculateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [product]);

  const renderProductTypeInfo = () => {
    switch (product.productType) {
      case 'AUCTION':
        return (
          <div className="flex flex-col gap-2">
            <span className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-lg flex items-center gap-1">
              <Gavel size={12} />
              Auction
            </span>
            {auctionStatus === 'live' && (
              <span className="bg-red-500 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-lg animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            )}
          </div>
        );
      
      case 'REGISTRATION':
        return (
          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-lg flex items-center gap-1">
            <UserPlus size={12} />
            {auctionStatus === 'registration_open' ? 'Registration Open' : 
             auctionStatus === 'registration_closed' ? 'Registration Closed' : 
             auctionStatus === 'live' ? 'Live Auction' : 'Auction Ended'}
          </span>
        );
      
      default:
        return (
          <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-lg">
            {product.category}
          </span>
        );
    }
  };

  const renderTimeLeft = () => {
    if (product.productType === 'AUCTION') {
      if (auctionStatus === 'ended') {
        return (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-3">
            <p className="text-red-300 text-sm font-semibold text-center">Auction Ended</p>
          </div>
        );
      }

      return (
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-orange-300 font-semibold flex items-center gap-1">
              <Clock size={12} />
              {auctionStatus === 'upcoming' ? 'Starts in:' : 'Ends in:'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-white">{timeLeft.days}</div>
              <div className="text-xs text-gray-400">Days</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{timeLeft.hours}</div>
              <div className="text-xs text-gray-400">Hrs</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{timeLeft.minutes}</div>
              <div className="text-xs text-gray-400">Min</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{timeLeft.seconds}</div>
              <div className="text-xs text-gray-400">Sec</div>
            </div>
          </div>
        </div>
      );
    } else if (product.productType === 'REGISTRATION') {
      if (auctionStatus === 'ended') {
        return (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-3">
            <p className="text-red-300 text-sm font-semibold text-center">Auction Ended</p>
          </div>
        );
      }

      if (auctionStatus === 'registration_open') {
        return (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-green-300 font-semibold flex items-center gap-1">
                <Timer size={12} />
                Registration closes in:
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.days}</div>
                <div className="text-xs text-gray-400">Days</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.hours}</div>
                <div className="text-xs text-gray-400">Hrs</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.minutes}</div>
                <div className="text-xs text-gray-400">Min</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.seconds}</div>
                <div className="text-xs text-gray-400">Sec</div>
              </div>
            </div>
          </div>
        );
      } else if (auctionStatus === 'registration_closed') {
        return (
          <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-orange-300 font-semibold flex items-center gap-1">
                <Clock size={12} />
                Auction starts in:
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.days}</div>
                <div className="text-xs text-gray-400">Days</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.hours}</div>
                <div className="text-xs text-gray-400">Hrs</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.minutes}</div>
                <div className="text-xs text-gray-400">Min</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.seconds}</div>
                <div className="text-xs text-gray-400">Sec</div>
              </div>
            </div>
          </div>
        );
      } else if (auctionStatus === 'live') {
        return (
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-orange-300 font-semibold flex items-center gap-1">
                <Clock size={12} />
                Auction ends in:
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.days}</div>
                <div className="text-xs text-gray-400">Days</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.hours}</div>
                <div className="text-xs text-gray-400">Hrs</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.minutes}</div>
                <div className="text-xs text-gray-400">Min</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{timeLeft.seconds}</div>
                <div className="text-xs text-gray-400">Sec</div>
              </div>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const renderPrice = () => {
    if (product.productType === 'AUCTION' || product.productType === 'REGISTRATION') {
      const startingPrice = product.auctionDetails?.startingPrice || 0;
      const currentPrice = product.auctionDetails?.currentPrice || startingPrice;

      return (
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-400">Starting Price:</span>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              रु{startingPrice.toLocaleString()}
            </span>
          </div>
          {currentPrice > startingPrice && (
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-400">Current Bid:</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                रु{currentPrice.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            रु{product.amount?.toLocaleString()}
          </span>
        </div>
      );
    }
  };

  const renderActionButtons = () => {
    if (product.productType === 'AUCTION') {
      if (auctionStatus === 'ended') {
        return (
          <motion.button
            disabled
            className="w-full mt-3 py-2.5 rounded-xl bg-gray-700 text-gray-400 font-semibold cursor-not-allowed"
          >
            Auction Ended
          </motion.button>
        );
      } else if (auctionStatus === 'upcoming') {
        return (
          <motion.button
            disabled
            className="w-full mt-3 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/50 text-orange-300 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Clock size={18} />
            <span>Auction Not Started</span>
          </motion.button>
        );
      } else {
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onBidClick?.(product);
            }}
            className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 group"
          >
            <Gavel size={18} className="group-hover:rotate-12 transition-transform duration-200" />
            <span>Place Bid</span>
          </motion.button>
        );
      }
    } else if (product.productType === 'REGISTRATION') {
      if (auctionStatus === 'ended') {
        return (
          <motion.button
            disabled
            className="w-full mt-3 py-2.5 rounded-xl bg-gray-700 text-gray-400 font-semibold cursor-not-allowed"
          >
            Auction Ended
          </motion.button>
        );
      } else if (auctionStatus === 'registration_open') {
        if (isRegistered) {
          return (
            <motion.button
              disabled
              className="w-full mt-3 py-2.5 rounded-xl bg-green-500/20 border border-green-500/50 text-green-300 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              <span>✓ Registered</span>
            </motion.button>
          );
        }
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={async (e) => {
              e.stopPropagation();
              const success = await onRegisterClick?.(product);
              if (success) {
                setIsRegistered(true);
              }
            }}
            className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 group"
          >
            <UserPlus size={18} className="group-hover:scale-110 transition-transform duration-200" />
            <span>Register Now</span>
          </motion.button>
        );
      } else if (auctionStatus === 'registration_closed') {
        if (isRegistered) {
          return (
            <motion.button
              disabled
              className="w-full mt-3 py-2.5 rounded-xl bg-green-500/20 border border-green-500/50 text-green-300 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              <span>✓ Registered - Waiting for Auction</span>
            </motion.button>
          );
        }
        return (
          <motion.button
            disabled
            className="w-full mt-3 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/50 text-orange-300 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Clock size={18} />
            <span>Registration Closed</span>
          </motion.button>
        );
      } else {
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onBidClick?.(product);
            }}
            className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 group"
          >
            <Gavel size={18} className="group-hover:rotate-12 transition-transform duration-200" />
            <span>Place Bid</span>
          </motion.button>
        );
      }
    } else {
      return (
        <>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onBuyClick?.(product, 1, product?.amount);
            }}
            className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 group"
          >
            <ShoppingBag size={18} className="group-hover:rotate-12 transition-transform duration-200" />
            <span>Buy Now</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            className="w-full mt-2 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 group"
          >
            <ShoppingCart size={18} className="group-hover:scale-110 transition-transform duration-200" />
            <span>Add to Cart</span>
          </motion.button>
        </>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="w-full"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white/5 backdrop-blur-md">
        <div onClick={() => onProductClick?.(product.itemId)}>
          <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 cursor-pointer">
            <motion.img
              src={primaryImage}
              alt={product.title}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />

            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="absolute top-3 left-3"
            >
              {renderProductTypeInfo()}
            </motion.div>

            {/* Rating Badge - Top Right */}
            {product.rating?.average && (
              <motion.div
                className="absolute top-3 right-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {renderStars()}
              </motion.div>
            )}

            {product.stock !== undefined && product.productType === 'DIRECT_SELL' && (
              <motion.div
                className="absolute bottom-3 right-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <div className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-md">
                  <span className="text-xs font-semibold text-gray-800">
                    {product.stock} left
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-4 space-y-3">
            <motion.h3
              className="text-lg font-bold text-white line-clamp-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {product.title}
            </motion.h3>

            <motion.div layout transition={{ duration: 0.3, ease: "easeInOut" }} className="relative">
              <motion.p
                layout
                className={`text-sm text-gray-400 leading-relaxed ${
                  showFullDesc ? "line-clamp-none" : "line-clamp-2"
                }`}
              >
                {product.description}
              </motion.p>

              {product.description?.length > 100 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullDesc((prev) => !prev);
                  }}
                  className="text-xs mt-1 text-blue-400 hover:text-purple-400 transition-colors"
                >
                  {showFullDesc ? "See Less" : "See More"}
                </button>
              )}
            </motion.div>
          </div>

          <div className="px-4">
            {renderTimeLeft()}
          </div>

          <motion.div
            className="px-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {renderPrice()}
          </motion.div>

          <div className="px-4 mt-3">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="px-4 py-3 flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-purple-500/50">
                {product.seller?.profilePicture ? (
                  <img
                    src={product.seller.profilePicture}
                    alt={product.seller?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                    {getInitials(product.seller?.name)}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{product.seller?.name}</span>
                <span className="text-xs text-gray-400">Verified</span>
              </div>
            </motion.div>

            <div className="flex items-center gap-1.5 text-gray-400 text-xs bg-white/5 px-2 py-1 rounded-lg">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="px-4 pb-4">
            {renderActionButtons()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
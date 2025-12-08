import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ShoppingBag, ChevronLeft, ChevronRight, User, Package, Clock, MoveLeft, Gavel, UserPlus, Timer, TrendingUp, Zap } from 'lucide-react';

function ProductInfoCard({ 
  product, 
  onAddToCart, 
  onBuyNow, 
  onBidClick, 
  onRegisterClick,
  onAutoBidClick,
  autoBidActive = false,
  onCancelAutoBid
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [auctionStatus, setAuctionStatus] = useState('upcoming');

  if (!product) return null;

  const { 
    itemId, 
    title, 
    description, 
    category, 
    stock, 
    amount, 
    createdAt, 
    seller, 
    images = [],
    productType,
    auctionDetails,
  } = product;

  const startingPrice = auctionDetails?.startingPrice;
  const currentPrice = auctionDetails?.currentPrice;
  const startTime = auctionDetails?.startTime;
  const endTime = auctionDetails?.endTime;
  const registrationEnd = auctionDetails?.registrationEnd;
  const bidCount = auctionDetails?.bidCount || 0;
  const highestBid = auctionDetails?.highestBid;

  const sortedImages = [...images].sort((a, b) => (a?.displayOrder || 0) - (b?.displayOrder || 0));

  useEffect(() => {
    if (productType === 'AUCTION' || productType === 'REGISTRATION') {
      const calculateTime = () => {
        const now = new Date().getTime();
        
        if (productType === 'AUCTION') {
          const start = new Date(startTime).getTime();
          const end = new Date(endTime).getTime();
          
          if (now < start) {
            setAuctionStatus('upcoming');
            const distance = start - now;
            updateTimeLeft(distance);
          } else if (now >= start && now < end) {
            setAuctionStatus('live');
            const distance = end - now;
            updateTimeLeft(distance);
          } else {
            setAuctionStatus('ended');
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          }
        } else if (productType === 'REGISTRATION') {
          const regEnd = new Date(registrationEnd).getTime();
          const start = new Date(startTime).getTime();
          const end = new Date(endTime).getTime();
          
          if (now < regEnd) {
            setAuctionStatus('registration_open');
            const distance = regEnd - now;
            updateTimeLeft(distance);
          } else if (now >= regEnd && now < start) {
            setAuctionStatus('registration_closed');
            const distance = start - now;
            updateTimeLeft(distance);
          } else if (now >= start && now < end) {
            setAuctionStatus('live');
            const distance = end - now;
            updateTimeLeft(distance);
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
  }, [productType, startTime, endTime, registrationEnd]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  const formatDate = (date) => {
    if (!date) return "Unknown date";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderProductTypeBadge = () => {
    switch (productType) {
      case 'AUCTION':
        return (
          <div className="flex flex-wrap gap-2">
            <div className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg flex items-center gap-2">
              <Gavel className="w-4 h-4" />
              <span className="font-semibold">Auction</span>
            </div>
            {auctionStatus === 'live' && (
              <div className="px-4 py-2 bg-red-500 text-white rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="font-semibold">LIVE</span>
              </div>
            )}
            {autoBidActive && auctionStatus === 'live' && (
              <motion.div
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full shadow-lg flex items-center gap-2 font-bold"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Zap className="w-4 h-4 animate-pulse" />
                <span>AUTO-BID</span>
              </motion.div>
            )}
          </div>
        );
      case 'REGISTRATION':
        return (
          <div className="flex flex-wrap gap-2">
            <div className={`px-4 py-2 bg-gradient-to-r ${auctionStatus === 'registration_open' ? 'from-green-500 to-emerald-600' : 'from-gray-500 to-gray-600'} text-white rounded-full shadow-lg flex items-center gap-2`}>
              <UserPlus className="w-4 h-4" />
              <span className="font-semibold">
                {auctionStatus === 'registration_open' ? 'Registration Open' : 
                 auctionStatus === 'registration_closed' ? 'Registration Closed' : 
                 auctionStatus === 'live' ? 'Live Auction' : 'Auction Ended'}
              </span>
            </div>
            {autoBidActive && auctionStatus === 'live' && (
              <motion.div
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full shadow-lg flex items-center gap-2 font-bold"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Zap className="w-4 h-4 animate-pulse" />
                <span>AUTO-BID</span>
              </motion.div>
            )}
          </div>
        );
      default:
        return (
          <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg">
            <span className="font-semibold">Direct Sale</span>
          </div>
        );
    }
  };

  const renderTimeDisplay = () => {
    if (productType === 'AUCTION') {
      if (auctionStatus === 'ended') {
        return (
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-red-300 mb-2">Auction Ended</h3>
            <p className="text-red-200">This auction concluded on {formatDate(endTime)}</p>
            {highestBid && (
              <div className="mt-4 pt-4 border-t border-red-500/30">
                <p className="text-red-200 text-sm">Final Bid</p>
                <p className="text-2xl font-bold text-red-300">रु{highestBid.amount?.toLocaleString()}</p>
                <p className="text-red-200/80 text-sm mt-1">by {highestBid.bidderName}</p>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-300" />
            <h3 className="text-xl font-bold text-white">
              {auctionStatus === 'upcoming' ? 'Auction Starts In' : 'Auction Ends In'}
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
              <div key={unit} className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white">{timeLeft[unit]}</div>
                <div className="text-sm text-gray-300 mt-1 capitalize">{unit}</div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (productType === 'REGISTRATION') {
      if (auctionStatus === 'ended') {
        return (
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-red-300 mb-2">Auction Ended</h3>
            <p className="text-red-200">This auction has concluded</p>
          </div>
        );
      }

      if (auctionStatus === 'registration_open') {
        return (
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-green-300" />
              <h3 className="text-xl font-bold text-white">Registration Closes In</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
                <div key={unit} className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">{timeLeft[unit]}</div>
                  <div className="text-sm text-gray-300 mt-1 capitalize">{unit}</div>
                </div>
              ))}
            </div>
          </div>
        );
      } else if (auctionStatus === 'registration_closed') {
        return (
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-300" />
              <h3 className="text-xl font-bold text-white">Auction Starts In</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
                <div key={unit} className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">{timeLeft[unit]}</div>
                  <div className="text-sm text-gray-300 mt-1 capitalize">{unit}</div>
                </div>
              ))}
            </div>
          </div>
        );
      } else if (auctionStatus === 'live') {
        return (
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-300" />
              <h3 className="text-xl font-bold text-white">Auction Ends In</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
                <div key={unit} className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">{timeLeft[unit]}</div>
                  <div className="text-sm text-gray-300 mt-1 capitalize">{unit}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const renderPriceSection = () => {
    if (productType === 'AUCTION') {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-white/60 text-sm mb-2">Starting Price</p>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
              रु{startingPrice?.toLocaleString() || "0"}
            </div>
          </div>
          {currentPrice && currentPrice > startingPrice && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-300" />
                  <p className="text-green-300 font-semibold">Current Highest Bid</p>
                </div>
                <span className="text-green-300 text-sm">{bidCount} bid{bidCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                रु{currentPrice?.toLocaleString()}
              </div>
              {highestBid && (
                <p className="text-green-300/80 text-sm mt-2">
                  by {highestBid.bidderName} • {new Date(highestBid.bidTime).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      );
    } else if (productType === 'REGISTRATION') {
      return (
        <div>
          <p className="text-white/60 text-sm mb-2">
            {auctionStatus === 'registration_open' ? 'Starting Price' : 'Price'}
          </p>
          <div className={`text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${
            auctionStatus === 'registration_open' ? 'from-green-400 to-emerald-400' : 'from-cyan-400 to-blue-400'
          }`}>
            रु{startingPrice?.toLocaleString() || "0"}
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <p className="text-white/60 text-sm mb-2">Price</p>
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            रु{amount?.toLocaleString() || "0"}
          </div>
        </div>
      );
    }
  };

  const renderActionButtons = () => {
    if (productType === 'AUCTION') {
      if (auctionStatus === 'ended') {
        return (
          <motion.button disabled className="w-full px-8 py-4 bg-gray-700 text-gray-400 font-bold text-lg rounded-xl cursor-not-allowed">
            Auction Ended
          </motion.button>
        );
      } else if (auctionStatus === 'upcoming') {
        return (
          <motion.button disabled className="w-full px-8 py-4 bg-orange-500/20 border border-orange-500/50 text-orange-300 font-bold text-lg rounded-xl cursor-not-allowed flex items-center justify-center gap-3">
            <Clock className="w-6 h-6" />
            Auction Not Started Yet
          </motion.button>
        );
      } else {
        return (
          <div className="space-y-3">
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={() => onBidClick?.(product)} 
              className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70"
            >
              <Gavel className="w-6 h-6" />
              Place Your Bid
            </motion.button>
            
            {autoBidActive ? (
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAutoBidClick?.(product)}
                  className="flex-1 px-6 py-4 bg-yellow-500/20 border-2 border-yellow-500/50 text-yellow-400 rounded-xl font-bold hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-3"
                >
                  <Zap className="w-5 h-5 animate-pulse" />
                  Auto-Bid Active
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCancelAutoBid?.(itemId)}
                  className="px-8 py-4 bg-red-500/20 border-2 border-red-500/50 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAutoBidClick?.(product)}
                className="w-full px-8 py-4 bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-400 rounded-xl font-bold hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-3"
              >
                <Zap className="w-6 h-6" />
                Set Auto-Bid
              </motion.button>
            )}
          </div>
        );
      }
    } else if (productType === 'REGISTRATION') {
      if (auctionStatus === 'ended') {
        return (
          <motion.button disabled className="w-full px-8 py-4 bg-gray-700 text-gray-400 font-bold text-lg rounded-xl cursor-not-allowed">
            Auction Ended
          </motion.button>
        );
      } else if (auctionStatus === 'registration_open') {
        const isRegistered = product.isUserRegistered;
        return (
          <motion.button 
            whileHover={{ scale: isRegistered ? 1 : 1.02 }} 
            whileTap={{ scale: isRegistered ? 1 : 0.98 }} 
            onClick={() => onRegisterClick?.(product)} 
            disabled={isRegistered} 
            className={`w-full px-8 py-4 ${isRegistered ? 'bg-green-500/20 border-2 border-green-500/50 text-green-300 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/50 hover:shadow-green-500/70'} text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-3`}
          >
            <UserPlus className="w-6 h-6" />
            {isRegistered ? '✓ Registered' : 'Register Now'}
          </motion.button>
        );
      } else if (auctionStatus === 'registration_closed') {
        return (
          <motion.button disabled className="w-full px-8 py-4 bg-orange-500/20 border border-orange-500/50 text-orange-300 font-bold text-lg rounded-xl cursor-not-allowed">
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-6 h-6" />
              <div className="text-center">
                <div>Registration Closed</div>
                <div className="text-sm opacity-80">Auction Starts Soon</div>
              </div>
            </div>
          </motion.button>
        );
      } else if (auctionStatus === 'live') {
        const isRegistered = product.isUserRegistered;
        
        if (!isRegistered) {
          return (
            <motion.button disabled className="w-full px-8 py-4 bg-gray-700 text-gray-400 font-bold text-lg rounded-xl cursor-not-allowed">
              Registration Required
            </motion.button>
          );
        }
        
        return (
          <div className="space-y-3">
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={() => onBidClick?.(product)} 
              className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70"
            >
              <Gavel className="w-6 h-6" />
              Place Your Bid
            </motion.button>
            
            {autoBidActive ? (
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAutoBidClick?.(product)}
                  className="flex-1 px-6 py-4 bg-yellow-500/20 border-2 border-yellow-500/50 text-yellow-400 rounded-xl font-bold hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-3"
                >
                  <Zap className="w-5 h-5 animate-pulse" />
                  Auto-Bid Active
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCancelAutoBid?.(itemId)}
                  className="px-8 py-4 bg-red-500/20 border-2 border-red-500/50 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAutoBidClick?.(product)}
                className="w-full px-8 py-4 bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-400 rounded-xl font-bold hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-3"
              >
                <Zap className="w-6 h-6" />
                Set Auto-Bid
              </motion.button>
            )}
          </div>
        );
      }
    } else {
      return (
        <div className="space-y-3">
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={() => onBuyNow?.(product, 1, product?.amount)} 
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
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 py-12 px-4">
      <motion.div 
        className='absolute top-6 left-6'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => window.history.back()}
          className='flex items-center gap-2 text-white/80 hover:text-cyan-300 transition-all duration-300 group -mt-4' 
        >
          <MoveLeft className='h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300' />
          Back to Home
        </button>
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
                    src={sortedImages[currentImageIndex]?.url || '/placeholder.png'}
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

                <div className="absolute top-4 left-4">
                  {renderProductTypeBadge()}
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
              
              {renderPriceSection()}

              {productType === 'DIRECT_SELL' && (
                <div className="flex items-center gap-4 text-sm mt-4">
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
              )}
            </div>

            {renderTimeDisplay()}

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-3">Description</h3>
              <p className="text-white/80 leading-relaxed">{description || "No description available."}</p>
            </div>

            {seller && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">Seller Information</h3>
                <div className="flex items-center gap-4">
                  <div className="relative"
                  onClick={(e)=>{
                    e.stopPropagation();
                    console.log("Seller profile clicked");
                  }}
                  >
                    {seller?.profilePicture ? (
                      <img
                        src={seller.profilePicture}
                        alt={seller.name || "Seller"}
                        className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center border-2 border-cyan-400">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-800" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-lg">
                      {seller?.name || "Unknown Seller"}
                    </p>
                    <p className="text-white/60 text-sm">{seller?.email || "No email provided"}</p>
                  </div>
                </div>
              </div>
            )}

            {renderActionButtons()}

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
  );
}

export default ProductInfoCard
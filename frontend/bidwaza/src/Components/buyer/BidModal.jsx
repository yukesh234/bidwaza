import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gavel, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '../../Context/Authcontext';

const BidModal = ({ show, product, bidAmount, setBidAmount, onClose, onSubmit }) => {
  const { balance } = useAuth();

  if (!product) return null;

  const currentPrice = product.auctionDetails?.currentPrice || product.auctionDetails?.startingPrice || 0;
  const minBid = currentPrice + 1;
  const availableBalance = balance || 0;

  const handleQuickBid = (increment) => {
    const newBid = currentPrice + increment;
    setBidAmount(newBid.toString());
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-lg w-full border border-gray-700 shadow-2xl relative"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                  <Gavel className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Place Your Bid</h2>
              </div>
              <p className="text-gray-400 text-sm">{product.title}</p>
            </div>

            {/* Current Price Info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 text-sm">Current Price</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-2xl font-bold text-white">
                    रु{currentPrice.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Minimum Bid</span>
                <span className="text-lg font-semibold text-orange-400">
                  रु{minBid.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300 text-sm">Available Balance</span>
                </div>
                <span className="text-xl font-bold text-blue-400">
                  रु{availableBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Quick Bid Buttons */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-3">
                Quick Bid
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((increment) => (
                  <button
                    key={increment}
                    onClick={() => handleQuickBid(increment)}
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    +रु{increment}
                  </button>
                ))}
              </div>
            </div>

            {/* Bid Amount Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Your Bid Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                  रु
                </span>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min={minBid}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={minBid.toString()}
                />
              </div>
              {parseFloat(bidAmount) < minBid && bidAmount && (
                <p className="text-red-400 text-xs mt-2">
                  Bid must be at least रु{minBid.toLocaleString()}
                </p>
              )}
              {parseFloat(bidAmount) > availableBalance && bidAmount && (
                <p className="text-red-400 text-xs mt-2">
                  Insufficient balance. Please top up your wallet.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={!bidAmount || parseFloat(bidAmount) < minBid || parseFloat(bidAmount) > availableBalance}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Gavel className="w-5 h-5" />
                Place Bid
              </button>
            </div>

            {/* Warning */}
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-xs text-center">
                Your bid amount will be held in your wallet until the auction ends.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BidModal;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, TrendingUp, Wallet, Settings } from 'lucide-react';
import { useAuth } from '../../Context/Authcontext';

const AutoBidModal = ({ show, product, onClose, onSubmit, existingAutoBid }) => {
  const { balance } = useAuth();
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [incrementAmount, setIncrementAmount] = useState(100);

  useEffect(() => {
    if (existingAutoBid) {
      setMaxBidAmount(existingAutoBid.maxBidAmount.toString());
      setIncrementAmount(existingAutoBid.incrementAmount);
    } else if (product) {
      const currentPrice = product.auctionDetails?.currentPrice || product.auctionDetails?.startingPrice || 0;
      setMaxBidAmount((currentPrice + 1000).toString());
    }
  }, [existingAutoBid, product]);

  if (!product) return null;

  const currentPrice = product.auctionDetails?.currentPrice || product.auctionDetails?.startingPrice || 0;
  const availableBalance = balance || 0;

  const handleQuickSet = (amount) => {
    const newMax = currentPrice + amount;
    setMaxBidAmount(newMax.toString());
  };

  const isValid = maxBidAmount && parseFloat(maxBidAmount) > currentPrice && parseFloat(maxBidAmount) <= availableBalance;

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
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Auto-Bid Settings</h2>
              </div>
              <p className="text-gray-400 text-sm">{product.title}</p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-blue-400 text-sm font-medium mb-1">How Auto-Bid Works</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Set a maximum amount you're willing to pay. When someone outbids you, the system will automatically place a bid on your behalf (after 10 seconds) using your increment amount, up to your maximum.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Price */}
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

            {/* Quick Set Buttons */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-3">
                Quick Max Bid
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1000, 5000, 10000, 20000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickSet(amount)}
                    className="py-2 px-3 bg-black/20 hover:bg-black/30 border border-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    +रु{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Bid Amount Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Maximum Bid Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                  रु
                </span>
                <input
                  type="number"
                  value={maxBidAmount}
                  onChange={(e) => setMaxBidAmount(e.target.value)}
                  min={currentPrice + 1}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder={(currentPrice + 1000).toString()}
                />
              </div>
              {parseFloat(maxBidAmount) <= currentPrice && maxBidAmount && (
                <p className="text-red-400 text-xs mt-2">
                  Max bid must be higher than current price
                </p>
              )}
              {parseFloat(maxBidAmount) > availableBalance && maxBidAmount && (
                <p className="text-red-400 text-xs mt-2">
                  Insufficient balance
                </p>
              )}
            </div>

            {/* Increment Amount */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Bid Increment Amount
              </label>
              <select
                value={incrementAmount}
                onChange={(e) => setIncrementAmount(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value={50} className="bg-slate-800 text-white">रु50</option>
                <option value={100}  className="bg-slate-800 text-white">रु100</option>
                <option value={500} className="bg-slate-800 text-white">रु500</option>
                <option value={1000} className="bg-slate-800 text-white">रु1,000</option>
                <option value={5000} className="bg-slate-800 text-white">रु5,000</option>
              </select>
              <p className="text-gray-400 text-xs mt-2">
                Amount to increase your bid each time
              </p>
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
                onClick={() => onSubmit({ maxBidAmount: parseFloat(maxBidAmount), incrementAmount })}
                disabled={!isValid}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {existingAutoBid ? 'Update Auto-Bid' : 'Enable Auto-Bid'}
              </button>
            </div>

            {/* Warning */}
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-xs text-center">
                Auto-bid will place bids automatically up to your maximum amount. Funds will be held in your wallet.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutoBidModal;
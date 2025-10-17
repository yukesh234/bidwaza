import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gavel, DollarSign } from "lucide-react";

const BidModal = React.memo(({ show, product, bidAmount, setBidAmount, onClose, onSubmit }) => {
  if (!show || !product) return null;

  const minBid =
    (product.auctionDetails?.currentPrice || product.auctionDetails?.startingPrice || 0) + 1;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-orange-500/50 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gavel className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Place Your Bid</h2>
              <p className="text-gray-400 mb-6">{product.title}</p>

              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Starting Price:</span>
                  <span className="text-white font-semibold">
                    ₹{product.auctionDetails?.startingPrice?.toLocaleString() || "0"}
                  </span>
                </div>
                {product.auctionDetails?.currentPrice && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Current Bid:</span>
                    <span className="text-green-400 font-semibold">
                      ₹{product.auctionDetails.currentPrice.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-gray-400 text-sm">Minimum Bid:</span>
                  <span className="text-orange-400 font-semibold">₹{minBid.toLocaleString()}</span>
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
                    min={minBid}
                    step="1"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Enter bid amount"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-colors"
                  onClick={onSubmit}
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
});

export default BidModal;

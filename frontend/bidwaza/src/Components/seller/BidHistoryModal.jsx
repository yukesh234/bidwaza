import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, TrendingUp, Clock, User, Loader2 } from 'lucide-react';
import { getBidHistory } from '../../services/sellerservices';
import toast from 'react-hot-toast';

function BidHistoryModal({ isOpen, onClose, listing }) {
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && listing?.id) {
      fetchBidHistory();
    }
  }, [isOpen, listing?.id]);

  const fetchBidHistory = async () => {
    setLoading(true);
    try {
      const response = await getBidHistory(listing.id);
      if (response.success) {
        setBidHistory(response.bidHistory || []);
      } else {
        toast.error('Failed to load bid history');
      }
    } catch (error) {
      console.error('Error fetching bid history:', error);
      toast.error('Failed to load bid history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBidStatusColor = (status) => {
    const colors = {
      WINNING: 'text-green-400 bg-green-400/10 border-green-400/50',
      WON: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/50',
      OUTBID: 'text-red-400 bg-red-400/10 border-red-400/50',
      LOST: 'text-gray-400 bg-gray-400/10 border-gray-400/50',
      ACTIVE: 'text-blue-400 bg-blue-400/10 border-blue-400/50'
    };
    return colors[status] || colors.ACTIVE;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-white/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-white/10 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-orange-400" />
                  Bid History
                </h2>
                <p className="text-white/60 text-sm">{listing?.title}</p>
                <div className="flex gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-white/60">Starting Price: </span>
                    <span className="text-white font-semibold">
                      रु{listing?.startingPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60">Current Bid: </span>
                    <span className="text-green-400 font-bold">
                      रु{listing?.currentPrice?.toLocaleString() || listing?.startingPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60">Total Bids: </span>
                    <span className="text-white font-semibold">{listing?.totalBids || 0}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
             {bidHistory.length > 0 && (
            <div className=" border-white/10 p-4">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-white/60 mb-1">Highest Bid</p>
                  <p className="text-white font-bold text-lg">
                    रु{Math.max(...bidHistory.map(b => b.bidAmount)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 mb-1">Unique Bidders</p>
                  <p className="text-white font-bold text-lg">
                    {new Set(bidHistory.map(b => b.bidderName)).size}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 mb-1">Avg Increment</p>
                  <p className="text-white font-bold text-lg">
                    रु{bidHistory.length > 1
                      ? Math.round((Math.max(...bidHistory.map(b => b.bidAmount)) - listing?.startingPrice) / (bidHistory.length - 1)).toLocaleString()
                      : 0}
                  </p>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin mb-3" />
                <p className="text-white/60">Loading bid history...</p>
              </div>
            ) : bidHistory.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Bids Yet</h3>
                <p className="text-white/60">This auction hasn't received any bids yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bidHistory.map((bid, index) => (
                  <motion.div
                    key={bid.bidId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white/5 backdrop-blur-sm border rounded-xl p-4 hover:bg-white/10 transition-all ${
                      bid.bidStatus === 'WINNING' || bid.bidStatus === 'WON'
                        ? 'border-green-400/50 shadow-lg shadow-green-400/10'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative">
                          {bid.bidderPicture ? (
                            <img
                              src={bid.bidderPicture}
                              alt={bid.bidderName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                          {(bid.bidStatus === 'WINNING' || bid.bidStatus === 'WON') && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Trophy className="w-3 h-3 text-slate-900" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-semibold truncate">
                              {bid.bidderName || 'Anonymous'}
                            </p>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getBidStatusColor(bid.bidStatus)}`}>
                              {bid.bidStatus}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/60">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(bid.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          bid.bidStatus === 'WINNING' || bid.bidStatus === 'WON'
                            ? 'text-green-400'
                            : 'text-white'
                        }`}>
                          रु{bid.bidAmount?.toLocaleString()}
                        </div>
                        {index === 0 && bidHistory.length > 1 && (
                          <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            +रु{(bid.bidAmount - (bidHistory[1]?.bidAmount || listing?.startingPrice || 0)).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats
          {bidHistory.length > 0 && (
            <div className="bg-white/5 border-t border-white/10 p-4">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-white/60 mb-1">Highest Bid</p>
                  <p className="text-white font-bold text-lg">
                    रु{Math.max(...bidHistory.map(b => b.bidAmount)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 mb-1">Unique Bidders</p>
                  <p className="text-white font-bold text-lg">
                    {new Set(bidHistory.map(b => b.bidderName)).size}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 mb-1">Avg Increment</p>
                  <p className="text-white font-bold text-lg">
                    रु{bidHistory.length > 1
                      ? Math.round((Math.max(...bidHistory.map(b => b.bidAmount)) - listing?.startingPrice) / (bidHistory.length - 1)).toLocaleString()
                      : 0}
                  </p>
                </div>
              </div>
            </div>
          )} */}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BidHistoryModal;
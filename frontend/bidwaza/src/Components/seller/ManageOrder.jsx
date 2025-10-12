
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  CreditCard, 
  ShoppingBag,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateOrderStatus } from '../../services/sellerservices';

const ManageOrderCard = ({ order, onStatusUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  if (!order) return null;

  const {
    orderId,
    orderNumber,
    totalOrderAmount,
    sellerRevenue,
    orderStatus,
    paymentStatus,
    esewaTxnId,
    orderDate,
    buyer,
    items = [],
    itemCount
  } = order;

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

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-300';
      case 'PENDING':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-300';
      case 'CANCELLED':
        return 'from-red-500/20 to-pink-500/20 border-red-500/30 text-red-300';
      case 'PAID':
        return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-300';
      case 'FAILED':
        return 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-300';
      default:
        return 'from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-300';
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const handleStatusChange = (newStatus) => {
    if (orderStatus === newStatus) {
      toast.error('Order is already in this status');
      return;
    }
    setSelectedStatus(newStatus);
    setShowConfirmModal(true);
  };

  const confirmStatusChange = async () => {
    setIsUpdating(true);
    setShowConfirmModal(false);

    try {
      const response = await updateOrderStatus(orderId, selectedStatus);

      if (response.success) {
        toast.success(`Order status updated to ${selectedStatus}`);
        
        // Callback to parent to refresh orders
        if (onStatusUpdate) {
          onStatusUpdate(orderId, selectedStatus);
        }
      } else {
        toast.error(response.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    } finally {
      setIsUpdating(false);
      setSelectedStatus(null);
    }
  };

  const canUpdateStatus = orderStatus === 'PENDING';

  return (
    <>
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
              {/* Order Number & Status */}
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

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border bg-gradient-to-r ${getStatusColor(orderStatus)} flex items-center gap-1.5`}>
                    {orderStatus === 'COMPLETED' && <CheckCircle className="w-3.5 h-3.5" />}
                    {orderStatus === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                    {orderStatus === 'CANCELLED' && <XCircle className="w-3.5 h-3.5" />}
                    {orderStatus}
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border bg-gradient-to-r ${getStatusColor(paymentStatus)}`}>
                    {paymentStatus}
                  </div>
                </div>
              </div>

              {/* Revenue Info */}
              <div className="text-right">
                <p className="text-sm text-white/60 mb-1">Your Revenue</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  ₹{sellerRevenue?.toLocaleString()}
                </p>
                <p className="text-xs text-white/40 mt-1">Total: ₹{totalOrderAmount?.toLocaleString()}</p>
              </div>
            </div>

            {/* Order Info Row */}
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

            {/* Buyer Info */}
            {buyer && (
              <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-white/50 mb-2">BUYER INFORMATION</p>
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-cyan-500/50">
                    {buyer.profilePicture ? (
                      <img
                        src={buyer.profilePicture}
                        alt={buyer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                        {getInitials(buyer.name)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{buyer.name}</p>
                    <p className="text-white/60 text-sm">{buyer.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Only show if order is PENDING */}
            {canUpdateStatus && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={isUpdating}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Completed
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={isUpdating}
                  className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Order
                </motion.button>
              </div>
            )}

            {!canUpdateStatus && (
              <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-white/60 text-sm">
                  Order status cannot be changed ({orderStatus})
                </p>
              </div>
            )}

            {/* Expand Button */}
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>{isExpanded ? 'Hide' : 'View'} Product Details</span>
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
                      Products in Order ({itemCount})
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
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={item.primaryImage}
                              alt={item.productTitle}
                              className="w-20 h-20 rounded-lg object-cover border border-white/20"
                            />
                            <div className={`mt-2 px-2 py-1 rounded-full text-[10px] font-semibold text-center ${
                              item.productStatus === 'ACTIVE' 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {item.productStatus}
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h5 className="text-white font-semibold mb-1">
                              {item.productTitle}
                            </h5>
                            
                            <div className="flex items-center gap-4 text-sm text-white/60 mb-2">
                              <span>Qty: {item.quantity}</span>
                              <span>₹{item.priceAtPurchase?.toLocaleString()} each</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-white/50">
                              <Package className="w-3 h-3" />
                              <span>Current Stock: {item.currentStock}</span>
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div className="text-right">
                            <p className="text-xs text-white/50 mb-1">Subtotal</p>
                            <p className="text-xl font-bold text-white">
                              ₹{item.subtotal?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Confirm Status Change</h3>
              </div>

              <p className="text-white/80 mb-6">
                Are you sure you want to change the order status to <span className="font-bold text-cyan-300">{selectedStatus}</span>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-xl transition-all ${
                    selectedStatus === 'COMPLETED'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ManageOrderCard;
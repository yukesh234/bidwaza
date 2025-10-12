
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  CreditCard, 
  ShoppingBag,
  User,
  CheckCircle
} from 'lucide-react';

const OrderCard = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
      // ORDER_STATUS values from DB constraint
      case 'COMPLETED':
        return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-300';
      case 'PENDING':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-300';
      case 'CANCELLED':
        return 'from-red-500/20 to-pink-500/20 border-red-500/30 text-red-300';
      
      // PAYMENT_STATUS values from DB constraint
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
                  <CheckCircle className="w-3.5 h-3.5" />
                  {orderStatus}
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border bg-gradient-to-r ${getStatusColor(paymentStatus)}`}>
                  {paymentStatus}
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="text-right">
              <p className="text-sm text-white/60 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                ₹{totalAmount?.toLocaleString()}
              </p>
              <p className="text-xs text-white/40 mt-1">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
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

          {/* Expand Button */}
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
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.primaryImage}
                            alt={item.productTitle}
                            className="w-20 h-20 rounded-lg object-cover border border-white/20"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-white font-semibold mb-1 truncate">
                            {item.productTitle}
                          </h5>
                          
                          <div className="flex items-center gap-4 text-sm text-white/60 mb-2">
                            <span>Qty: {item.quantity}</span>
                            <span>₹{item.priceAtPurchase?.toLocaleString()} each</span>
                          </div>

                          {/* Seller Info */}
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
  );
};

export default OrderCard;

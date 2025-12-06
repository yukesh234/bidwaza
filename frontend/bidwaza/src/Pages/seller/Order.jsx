import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ManageOrderCard from '../../Components/seller/ManageOrder.jsx';
import { getSellerOrders, updateOrderStatus } from '../../services/sellerservices.js';
import toast from 'react-hot-toast';
import { Package, MoveLeft, Loader, DollarSign } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getSellerOrders();
      
      if (response.success) {
        setOrders(response.data.orders || []);
        setTotalRevenue(response.data.totalRevenue || 0);
        if (response.data.orders?.length > 0) {
          toast.success('Orders loaded successfully');
        }
      } else {
        toast.error(response.message || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Orders error:', error);
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    // Refresh orders after status update
   try {
     const response = await updateOrderStatus(orderId, newStatus);
      if (response.success) {
        toast.success(response.message || 'Order status updated');
        fetchOrders();
      } else {
        toast.error(response.message || 'Failed to update order status');
      }
   } catch (error) {
    console.error('Status update error:', error);
    toast.error('Error updating order status');
   }
    
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 py-8">
      {/* Back Button */}
      <motion.div 
        className='absolute top-6 left-6'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <NavLink
          to="/"
          className='flex items-center gap-2 text-white/80 hover:text-cyan-300 transition-all duration-300 group'
        >
          <MoveLeft className='h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300' />
          Back to Dashboard
        </NavLink>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 mt-16">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Package className="w-10 h-10 text-cyan-400" />
            Manage Orders
          </h1>
          <div className="flex items-center gap-6 text-white/60">
            <span>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Total Revenue: रु{totalRevenue.toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center"
          >
            <Package className="w-20 h-20 text-white/40 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No orders yet</h2>
            <p className="text-white/60">Your orders will appear here</p>
          </motion.div>
        ) : (
          /* Orders List */
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.orderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ManageOrderCard 
                  order={order} 
                  onStatusUpdate={handleStatusUpdate}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Order;
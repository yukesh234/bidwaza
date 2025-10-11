import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

const PaymentFailure = () => {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem('pendingPayment');
    toast.error('Payment failed or cancelled');
    
    setTimeout(() => {
      navigate('/');
    }, 3000);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-6"
        >
          <XCircle className="w-20 h-20 text-red-400" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-3">Payment Failed ❌</h2>
        <p className="text-white/80 mb-2">Your payment was not successful or was cancelled.</p>
        <p className="text-cyan-300 text-sm">Redirecting to home...</p>
      </motion.div>
    </div>
  );
};

export default PaymentFailure;

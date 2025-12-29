import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {motion} from 'framer-motion'
import { Check } from "lucide-react";


export function WalletFailure() {
  const navigate = useNavigate();
  const [failureReason] = useState('Payment was not completed');

  const handleRetry = () => {
    navigate('/wallet');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center p-4">
      <motion.div
        className="max-w-md w-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 text-center">
          <motion.div
            className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
            animate={{ scale: [0.8, 1.1, 1], rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.6 }}
          >
            <Check className="w-8 h-8 text-red-400" />
          </motion.div>

          <motion.h2
            className="text-2xl font-bold mb-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Payment Failed
          </motion.h2>

          <motion.div
            className="space-y-3 mb-6 text-left"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-300">{failureReason}</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-400">What happened?</p>
              <p className="text-sm text-gray-300">
                Your payment was declined or cancelled. No amount has been deducted from your account.
              </p>
            </div>
          </motion.div>

          <motion.p
            className="text-gray-400 mb-6 text-sm"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Please try again with a valid payment method or contact support if the issue persists.
          </motion.p>

          <motion.div
            className="flex gap-3"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleHome}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all"
            >
              Go Home
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold transition-all"
            >
              Try Again
            </button>
          </motion.div>

          <motion.button
            onClick={() => navigate('/orders')}
            className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            View Your Orders
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
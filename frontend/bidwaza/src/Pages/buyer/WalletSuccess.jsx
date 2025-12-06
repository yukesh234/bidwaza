import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader, X } from 'lucide-react';
import api from '../../API/api.js';

export default function WalletSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationData, setVerificationData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const data = searchParams.get('data');

        if (!data) {
          setError('No payment data received');
          setLoading(false);
          return;
        }

        // Send verification request to backend
        const response = await api.post('/wallet/verify', { data });

        if (response.data.success) {
          setVerificationData(response.data);
          setLoading(false);
        } else {
          setError(response.data.message || 'Payment verification failed');
          setLoading(false);
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.response?.data?.message || 'Verification failed');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleReturnHome = () => {
 
    navigate('/wallet');
     window.location.reload();
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center p-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader className="w-16 h-16 text-blue-400" />
          </motion.div>
          <p className="text-xl font-semibold">Verifying Payment...</p>
          <p className="text-gray-400 mt-2">Please wait while we confirm your transaction</p>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center p-4">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 text-center">
            <motion.div
              className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ duration: 0.6 }}
            >
              <X className="w-8 h-8 text-red-400" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={handleReturnHome}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold transition-all"
            >
              Return to Wallet
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success State
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
            className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
            animate={{ scale: [0.8, 1.1, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6 }}
          >
            <Check className="w-8 h-8 text-green-400" />
          </motion.div>

          <motion.h2
            className="text-2xl font-bold mb-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Payment Successful!
          </motion.h2>

          <motion.div
            className="space-y-3 mb-6 text-left"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-400">Amount Added</p>
              <p className="text-xl font-bold text-green-400">
                रु{verificationData?.amount?.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-400">Transaction ID</p>
              <p className="text-sm font-mono break-all">{verificationData?.transaction_uuid}</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-400">Status</p>
              <p className="text-sm font-semibold text-green-400">✓ Verified</p>
            </div>
          </motion.div>

          <motion.p
            className="text-gray-400 mb-6"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Your wallet has been credited successfully. You can now use these coins for bidding and purchases.
          </motion.p>

          <motion.button
            onClick={handleReturnHome}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold transition-all"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Back to Wallet
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../Context/Authcontext';
import { verifyPayment } from '../services/userservices';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CheckCircle, Loader, XCircle } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Use ref to prevent multiple verifications
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (verificationAttempted.current) {
      return;
    }
    verificationAttempted.current = true;

    const verifyPaymentHandler = async () => {
      try {
        console.log('=== Payment Success Callback ===');
        
        // eSewa v2 sends data as base64-encoded JSON
        const encodedData = searchParams.get('data');
        console.log('Encoded data:', encodedData);

        if (!encodedData) {
          setTimeout(() => {
            toast.error('Invalid payment response from eSewa');
            setLoading(false);
            navigate('/');
          }, 1000);
          return;
        }

        // Decode the base64 data
        const decodedData = JSON.parse(atob(encodedData));
        console.log('Decoded payment data:', decodedData);

        const { transaction_code, total_amount, status, transaction_uuid } = decodedData;

        if (!transaction_code || !total_amount || !transaction_uuid) {
          toast.error('Invalid payment details');
          setLoading(false);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Check if payment was successful
        if (status !== 'COMPLETE') {
          toast.error('Payment was not completed');
          setLoading(false);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Get pending payment info
        const pendingPaymentStr = sessionStorage.getItem('pendingPayment');
        console.log('Pending payment:', pendingPaymentStr);

        if (!pendingPaymentStr) {
          toast.error('Payment session expired');
          setLoading(false);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        const pendingPayment = JSON.parse(pendingPaymentStr);
        console.log("Pending payment data:", pendingPayment);

        // Get userId from pendingPayment (NOT from user object)
        const userId = pendingPayment.userId;
        
        console.log("Using userId:", userId);

        if (!userId) {
          toast.error('Payment session incomplete. Please try again.');
          setLoading(false);
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Prepare verification data
        const paymentData = {
          transaction_uuid,
          amt: total_amount,
          refId: transaction_code,
          userId,
          ...(pendingPayment.type === 'cart' 
            ? { cartItems: pendingPayment.cartItems }
            : { productId: pendingPayment.productId, quantity: pendingPayment.quantity }
          )
        };

        console.log('Sending verification request:', paymentData);

        const response = await verifyPayment(paymentData);
        console.log('Verification response:', response);

        if (response.success) {
          setVerified(true);
          // Clear sessionStorage immediately after successful verification
          sessionStorage.removeItem('pendingPayment');
          toast.success('Payment successful!');
          
          // Navigate to orders page after 2 seconds
          setTimeout(() => {
            navigate('/orders');
          }, 2000);
        } else {
          toast.error(response.message || 'Payment verification failed');
          setLoading(false);
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Payment verification failed');
        setLoading(false);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    verifyPaymentHandler();
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center max-w-md w-full"
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-6"
            >
              <Loader className="w-16 h-16 text-cyan-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment...</h2>
            <p className="text-white/60">Please wait while we confirm your payment</p>
          </>
        ) : verified ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto mb-6"
            >
              <CheckCircle className="w-20 h-20 text-emerald-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-3">Payment Successful! ✅</h2>
            <p className="text-white/80 mb-2">Your order has been placed successfully.</p>
            <p className="text-cyan-300 text-sm">Redirecting to your orders...</p>
          </>
        ) : (
          <>
            <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-white/60">Redirecting you back...</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
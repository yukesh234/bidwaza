import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUpRight, Check, Loader, AlertCircle } from 'lucide-react';
import api from '../../API/api.js';

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState('topup');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ NEW: State for transaction history
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const formRef = useRef(null);

  const topupAmounts = [500, 1000, 2500, 5000, 10000];

  // ✅ NEW: Fetch transaction history
  const fetchTransactionHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    
    try {
      const response = await api.get('/wallet/history');
      // Assuming response structure: { success: true, transactions: [...], balance: 5000 }
      setTransactionHistory(response.data.transactions || []);
      setWalletBalance(response.data.balance || 0);
    } catch (err) {
      console.error('Failed to fetch transaction history:', err);
      setHistoryError(err.response?.data?.message || 'Failed to load transaction history');
    } finally {
      setHistoryLoading(false);
    }
  };

  
  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactionHistory();
    }
  }, [activeTab]);

  const handleTopup = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setShowConfirm(true);
    setError(null);
  };

  const handleCustomTopup = () => {
    if (customAmount && customAmount > 0) {
      setSelectedAmount(parseInt(customAmount));
      setShowConfirm(true);
      setError(null);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const processEsewa = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call your backend API to initiate payment using axios instance
      const response = await api.post('/wallet/pay', {
        amount: selectedAmount
      });

      const data = response.data;

      // Create and submit form to eSewa
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.esewaURL;

      Object.keys(data.paymentData).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data.paymentData[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  // ✅ NEW: Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-gray-400">Top up or view your transaction history</p>
          
          {/* ✅ NEW: Wallet Balance Display */}
          {walletBalance > 0 && (
            <div className="mt-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4">
              <p className="text-sm text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold text-blue-400">रु{walletBalance.toLocaleString()}</p>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex gap-6 mb-8 border-b border-gray-700/50 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <button
            onClick={() => handleTabChange('topup')}
            className={`pb-4 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'topup'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Plus className="w-5 h-5" />
            Top Up
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`pb-4 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            History
          </button>
        </motion.div>

        {/* Top Up Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'topup' && (
            <motion.div
              className="space-y-8 relative z-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Quick Amount Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Amount</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {topupAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleTopup(amount)}
                      className={`border-2 rounded-xl p-4 transition-all duration-300 font-semibold text-lg ${
                        selectedAmount === amount && !showConfirm
                          ? 'border-blue-500 bg-blue-600/20'
                          : 'border-gray-700 bg-gray-800/50 hover:border-blue-500 hover:bg-gray-800'
                      }`}
                    >
                      रु{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Custom Amount</h3>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-4 text-gray-400 font-semibold">रु</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleCustomTopup}
                    disabled={!customAmount || customAmount <= 0}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-8 font-semibold transition-all duration-300"
                  >
                    Top Up
                  </button>
                </div>
              </div>
            </motion.div>
          )}

         
          {activeTab === 'history' && (
            <motion.div
              className="space-y-3 relative z-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Loading State */}
              {historyLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-blue-400" />
                </div>
              )}

              {/* Error State */}
              {historyError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-sm text-red-300">{historyError}</p>
                </div>
              )}

              {/* Empty State */}
              {!historyLoading && !historyError && transactionHistory.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowUpRight className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start by topping up your wallet</p>
                </div>
              )}

              {/* Transaction List */}
              {!historyLoading && !historyError && transactionHistory.map((tx) => (
                <div
                  key={tx.TRANSACTION_ID || tx.transaction_id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      tx.STATUS === 'SUCCESS' || tx.status === 'SUCCESS'
                        ? 'bg-green-500/20'
                        : 'bg-red-500/20'
                    }`}>
                      {tx.STATUS === 'SUCCESS' || tx.status === 'SUCCESS' ? (
                        <Check className="w-6 h-6 text-green-400" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {tx.TRANSACTION_TYPE || tx.transaction_type || 'Wallet Top Up'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDate(tx.CREATED_AT || tx.created_at)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {tx.REFERENCE_ID || tx.reference_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      tx.STATUS === 'SUCCESS' || tx.status === 'SUCCESS'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      +रु{(tx.AMOUNT || tx.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {tx.STATUS || tx.status || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tx.PAYMENT_METHOD || tx.payment_method || ''}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && setShowConfirm(false)}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 relative z-50"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h2 className="text-2xl font-bold mb-2">Confirm Top Up</h2>
                <p className="text-gray-400 mb-6">
                  Amount: <span className="text-blue-400 font-bold text-2xl">रु{selectedAmount?.toLocaleString()}</span>
                </p>

                <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Payment Gateway</p>
                  <p className="font-semibold text-green-400 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">eSewa</span>
                    </div>
                    eSewa
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mb-6 text-center">
                  You will be redirected to eSewa to complete the payment securely.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={loading}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processEsewa}
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Pay with eSewa'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
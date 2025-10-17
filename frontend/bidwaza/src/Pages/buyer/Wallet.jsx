import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUpRight, Check } from 'lucide-react';

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState('topup');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [transactionId, setTransactionId] = useState(null);

  const topupAmounts = [500, 1000, 2500, 5000, 10000];

  const handleTopup = (amount) => {
    console.log('Topup clicked:', amount);
    setSelectedAmount(amount);
    setCustomAmount('');
    setShowConfirm(true);
  };

  const handleCustomTopup = () => {
    console.log('Custom topup clicked:', customAmount);
    if (customAmount && customAmount > 0) {
      setSelectedAmount(parseInt(customAmount));
      setShowConfirm(true);
    }
  };

  const handleTabChange = (tab) => {
    console.log('Tab changed to:', tab);
    setActiveTab(tab);
  };

  const processEsewa = () => {
    const newTxId = `TXN-${Date.now()}`;
    setTransactionId(newTxId);
    setTimeout(() => {
      setShowConfirm(false);
      setSelectedAmount(null);
      setCustomAmount('');
      setTransactionId(null);
    }, 2000);
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
                  {topupAmounts.map((amount, idx) => (
                    <button
                      key={amount}
                      onClick={() => handleTopup(amount)}
                      className={`border-2 rounded-xl p-4 transition-all duration-300 font-semibold text-lg cursor-pointer ${
                        selectedAmount === amount
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
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 cursor-text"
                    />
                  </div>
                  <button
                    onClick={handleCustomTopup}
                    disabled={!customAmount || customAmount <= 0}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-8 font-semibold transition-all duration-300 cursor-pointer"
                  >
                    Top Up
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              className="space-y-3 relative z-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {[
                { id: 1, amount: 5000, date: 'Oct 14, 2025 3:45 PM', status: 'Success', txId: 'TXN-001' },
                { id: 2, amount: 10000, date: 'Oct 12, 2025 2:15 PM', status: 'Success', txId: 'TXN-002' },
                { id: 3, amount: 2500, date: 'Oct 10, 2025 11:30 AM', status: 'Success', txId: 'TXN-003' },
                { id: 4, amount: 1000, date: 'Oct 8, 2025 5:20 PM', status: 'Success', txId: 'TXN-004' },
                { id: 5, amount: 7500, date: 'Oct 5, 2025 9:10 AM', status: 'Success', txId: 'TXN-005' },
              ].map((tx, idx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Wallet Top Up</p>
                      <p className="text-sm text-gray-400">{tx.date}</p>
                      <p className="text-xs text-gray-500 mt-1">{tx.txId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400 text-lg">
                      +रु{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{tx.status}</p>
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
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 relative z-50"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {!transactionId ? (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Confirm Top Up</h2>
                  <p className="text-gray-400 mb-6">
                    Amount: <span className="text-blue-400 font-bold text-2xl">रु{selectedAmount?.toLocaleString()}</span>
                  </p>

                  <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Payment Gateway</p>
                    <p className="font-semibold text-green-400 flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-xs font-bold">eSewa</span>
                      </div>
                      eSewa
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 mb-6 text-center">
                    You will be redirected to eSewa to complete the payment securely.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={processEsewa}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold transition-all cursor-pointer"
                    >
                      Pay with eSewa
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <motion.div
                    className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                    animate={{ scale: [0.8, 1.1, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.6 }}
                  >
                    <Check className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
                  <p className="text-gray-400 mb-4">
                    रु{selectedAmount?.toLocaleString()} has been added to your wallet.
                  </p>
                  <p className="text-xs text-gray-500">Transaction ID: {transactionId}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
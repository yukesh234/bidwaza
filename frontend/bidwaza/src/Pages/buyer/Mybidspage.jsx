import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, DollarSign, Calendar, 
  CheckCircle, Clock, XCircle, AlertCircle,
  Search, Eye, RefreshCw, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../API/api';
import toast from 'react-hot-toast';

const MyWinsPage = () => {
  const navigate = useNavigate();
  const [wins, setWins] = useState([]);
  const [filteredWins, setFilteredWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    totalSpent: 0
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Fetch wins from API
  const fetchWins = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auction/myWins');
      console.log('Fetch Wins Response:', response);
      if (response.data.success) {
        const winsData = response.data.data;
        setWins(winsData);
        setFilteredWins(winsData);
        
        // Calculate summary
        const paid = winsData.filter(w => w.paymentStatus === 'PAID').length;
        const pending = winsData.filter(w => w.paymentStatus === 'PENDING' || !w.paymentStatus).length;
        const totalSpent = winsData
          .filter(w => w.paymentStatus === 'PAID')
          .reduce((sum, w) => sum + (w.winningBid || 0), 0);
        
        setSummary({
          total: winsData.length,
          paid,
          pending,
          totalSpent
        });
      } else {
        toast.error(response.data.message || 'Failed to fetch wins');
      }
    } catch (error) {
      console.error('Error fetching wins:', error);
      toast.error('Failed to load your wins');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWins();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let result = [...wins];

    // Filter by payment status
    if (filterStatus !== 'all') {
      result = result.filter(win => {
        const status = win.paymentStatus || 'PENDING';
        return status === filterStatus.toUpperCase();
      });
    }

    // Search by title
    if (searchTerm) {
      result = result.filter(win => 
        win.productTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'highest':
        result.sort((a, b) => (b.winningBid || 0) - (a.winningBid || 0));
        break;
      case 'lowest':
        result.sort((a, b) => (a.winningBid || 0) - (b.winningBid || 0));
        break;
      default:
        break;
    }

    setFilteredWins(result);
  }, [wins, filterStatus, searchTerm, sortBy]);

  const getStatusBadge = (status) => {
    const normalizedStatus = status || 'PENDING';
    const badges = {
      PAID: {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Paid',
        className: 'bg-green-500/20 border-green-500/50 text-green-300'
      },
      PENDING: {
        icon: <Clock className="w-4 h-4" />,
        text: 'Payment Pending',
        className: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
      },
      FAILED: {
        icon: <XCircle className="w-4 h-4" />,
        text: 'Payment Failed',
        className: 'bg-red-500/20 border-red-500/50 text-red-300'
      }
    };
    
    const badge = badges[normalizedStatus] || badges.PENDING;
    
    return (
      <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${badge.className} font-semibold text-sm whitespace-nowrap`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewProduct = (itemId) => {
    navigate(`/productinfo/${itemId}`);
  };

  const handlePayment = (itemId, winningBid) => {
    // Navigate to payment page with item details
    navigate(`/payment`, { 
      state: { 
        itemId, 
        amount: winningBid,
        type: 'auction_win'
      } 
    });
  };

  const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
    <motion.div
      whileHover={{ y: -4 }}
      className={`bg-gradient-to-br ${color} p-6 rounded-2xl border border-white/10 shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white mt-4 text-lg">Loading your wins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-400" />
              My Wins
            </h1>
            <p className="text-gray-400 mt-2">Congratulations on your successful bids!</p>
          </div>
          <button
            onClick={fetchWins}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Trophy}
            label="Total Wins"
            value={summary.total}
            color="from-yellow-600/20 to-yellow-800/20"
          />
          <StatCard
            icon={CheckCircle}
            label="Paid"
            value={summary.paid}
            color="from-green-600/20 to-green-800/20"
          />
          <StatCard
            icon={Clock}
            label="Pending Payment"
            value={summary.pending}
            color="from-orange-600/20 to-orange-800/20"
          />
          <StatCard
            icon={DollarSign}
            label="Total Spent"
            value={`रु${summary.totalSpent.toLocaleString()}`}
            color="from-purple-600/20 to-purple-800/20"
            subtitle="On paid items"
          />
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all" className="bg-slate-800 text-white">All Status</option>
              <option value="paid" className="bg-slate-800 text-white">Paid</option>
              <option value="pending" className="bg-slate-800 text-white">Pending</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="recent" className="bg-slate-800 text-white">Most Recent</option>
              <option value="oldest" className="bg-slate-800 text-white">Oldest First</option>
              <option value="highest" className="bg-slate-800 text-white">Highest Amount</option>
              <option value="lowest" className="bg-slate-800 text-white">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Wins Display */}
        {filteredWins.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Wins Found</h3>
            <p className="text-gray-400">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : 'You haven\'t won any auctions yet. Keep bidding!'}
            </p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Winning Bid</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Payment Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Won Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredWins.map((win, index) => (
                    <motion.tr
                      key={win.winnerId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={win.imageUrl || '/placeholder.png'}
                              alt={win.productTitle}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Trophy className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{win.productTitle}</p>
                            <p className="text-sm text-gray-400 line-clamp-1">{win.productDescription}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-2xl font-bold text-yellow-400">
                          रु{win.winningBid?.toLocaleString() || '0'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(win.paymentStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300 text-sm">
                            {formatDate(win.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewProduct(win.itemId)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-300"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          {(!win.paymentStatus || win.paymentStatus === 'PENDING') && (
                            <button
                              onClick={() => handlePayment(win.itemId, win.winningBid)}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                            >
                              <CreditCard className="w-4 h-4" />
                              Pay Now
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredWins.map((win, index) => (
                <motion.div
                  key={win.winnerId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={win.imageUrl || '/placeholder.png'}
                        alt={win.productTitle}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{win.productTitle}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{win.productDescription}</p>
                      <div className="mt-2">
                        {getStatusBadge(win.paymentStatus)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Winning Bid</p>
                      <p className="text-xl font-bold text-yellow-400">
                        रु{win.winningBid?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Won Date</p>
                      <p className="text-sm text-gray-300">
                        {formatDate(win.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleViewProduct(win.itemId)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {(!win.paymentStatus || win.paymentStatus === 'PENDING') && (
                      <button
                        onClick={() => handlePayment(win.itemId, win.winningBid)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay Now
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWinsPage;
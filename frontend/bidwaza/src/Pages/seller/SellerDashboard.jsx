import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { 
  Store, Plus, TrendingUp, DollarSign, Eye, Edit3, Trash2, 
  Clock, Users, Gavel, Package, Star, BarChart3, Calendar,
  Search, Filter, MoreHorizontal, AlertCircle, CheckCircle,
  ArrowUp, ArrowDown, Bell, Settings, LogOut, Crown, Zap,
  Camera, Heart, MessageCircle, Share2, Download, Upload, X,
  User, Wallet, ChevronDown, ShoppingBag
} from "lucide-react"
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/Authcontext'

function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate();
  const {logout, user:User} = useAuth();
  
  const user = {
    firstName: User?.FIRST_NAME || "John",
    lastName: User?.LAST_NAME || "Doe",
    email: User?.EMAIL ||"john.doe@example.com",
    profilePicture: User?.PROFILE_PICTURE_URL
  }

  const [sellerStats, setSellerStats] = useState({
    totalListings: 0,
    activeAuctions: 0,
    soldItems: 0,
    totalEarnings: 0,
    avgSalePrice: 0,
    successRate: 0,
    rating: 0,
    reviews: 0
  })

  const [listings, setListings] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  // Utility function to generate stats cards data
  const getStatsCardsData = (stats) => [
    { 
      label: 'Total Earnings', 
      value: `$${stats.totalEarnings.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'from-green-500 to-emerald-500' 
    },
    { 
      label: 'Active Listings', 
      value: stats.activeAuctions, 
      icon: Package, 
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      label: 'Items Sold', 
      value: stats.soldItems, 
      icon: TrendingUp, 
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      label: 'Seller Rating', 
      value: `${stats.rating}/5`, 
      icon: Star, 
      color: 'from-yellow-500 to-orange-500' 
    }
  ]

  useEffect(() => {
    // TODO: Fetch seller stats from API
    // fetchSellerStats().then(data => setSellerStats(data))
    
    // TODO: Fetch listings from API
    // fetchListings().then(data => setListings(data))
    
    // TODO: Fetch recent activity from API
    // fetchRecentActivity().then(data => setRecentActivity(data))
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = () => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-400 bg-green-400/10',
      draft: 'text-yellow-400 bg-yellow-400/10',
      sold: 'text-blue-400 bg-blue-400/10',
      ended: 'text-gray-400 bg-gray-400/10'
    }
    return colors[status] || 'text-gray-400 bg-gray-400/10'
  }

  const getActivityIcon = (type) => {
    const icons = { bid: Gavel, view: Eye, sold: CheckCircle, message: MessageCircle, featured: Star }
    return icons[type] || Bell
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'listings', label: 'My Listings', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const statsCards = getStatsCardsData(sellerStats)

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900'>
      <motion.header 
        className='bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-4'>
              <div className='w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center'>
                <Store className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-white'>Seller Dashboard</h1>
                <p className='text-white/60 text-sm'>Manage your store</p>
              </div>
            </div>
            
            <div className='flex items-center gap-4'>
              <button
                onClick={() => setShowCreateModal(true)}
                className='px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all'
              >
                <Plus className='w-5 h-5' />
                New Listing
              </button>

              <button className='relative p-2 text-white/60 hover:text-white transition-colors'>
                <Bell className='w-6 h-6' />
                <span className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full'></span>
              </button>

              <div className='relative' ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className='flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full hover:border-cyan-400/50 transition-all'
                >
                  <div className='relative'>
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt="Profile" 
                        className='w-8 h-8 rounded-full object-cover border-2 border-cyan-400/50'
                      />
                    ) : (
                      <div className='w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm'>
                        {getInitials()}
                      </div>
                    )}
                    <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white/20 rounded-full'></div>
                  </div>
                  <div className='flex flex-col items-start'>
                    <span className='text-white font-medium text-sm'>{user.firstName}</span>
                    <span className='text-cyan-300 text-xs'>Seller</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className='absolute right-0 mt-2 w-70 bg-gray-900/95 backdrop-blur-md border border-cyan-400/20 rounded-2xl shadow-2xl overflow-hidden'>
                    <div className='px-6 py-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-400/20'>
                      <div className='flex items-center gap-3'>
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
                            alt="Profile" 
                            className='w-12 h-12 rounded-full object-cover border-2 border-cyan-400/50'
                          />
                        ) : (
                          <div className='w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg'>
                            {getInitials()}
                          </div>
                        )}
                        <div>
                          <h3 className='text-white font-semibold'>{`${user.firstName} ${user.lastName}`}</h3>
                          <p className='text-cyan-300 text-sm'>{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className='py-2'>
                      <button 
                        onClick={()=>{
                          console.log("clicked");
                          navigate("/");
                        }}
                        className='w-full flex items-center gap-4 px-6 py-3 hover:bg-cyan-500/10 transition-colors'
                      >
                        <div className='p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg'>
                          <ShoppingBag className='w-5 h-5 text-cyan-300' />
                        </div>
                        <div className='flex-1 text-left'>
                          <p className='text-white font-medium text-sm'>Switch to Buying</p>
                          <p className='text-white/60 text-xs'>Browse marketplace</p>
                        </div>
                      </button>
                      <div className='border-t border-cyan-400/20 my-2'></div>
                      <button 
                        onClick={logout}
                        className='w-full flex items-center gap-4 px-6 py-3 hover:bg-red-500/10 transition-colors'
                      >
                        <div className='p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg'>
                          <LogOut className='w-5 h-5 text-red-300' />
                        </div>
                        <div className='flex-1 text-left'>
                          <p className='text-white font-medium text-sm'>Logout</p>
                          <p className='text-white/60 text-xs'>Sign out</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='flex gap-8 items-start'>
          <aside className='w-64 flex-shrink-0 space-y-2 sticky top-24'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className='w-5 h-5' />
                {tab.label}
              </button>
            ))}
          </aside>

          <main className='flex-1 min-w-0'>
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview" 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-4 gap-6">
                    {statsCards.map((stat) => (
                      <motion.div 
                        key={stat.label} 
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-white/60 text-sm">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Bell className="w-6 h-6" />
                        Recent Activity
                      </h3>
                      <div className="space-y-4">
                        {recentActivity.length > 0 ? recentActivity.map((activity, i) => {
                          const Icon = getActivityIcon(activity.type)
                          return (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white text-sm">{activity.message}</p>
                                <p className="text-white/40 text-xs">{activity.time}</p>
                              </div>
                              {activity.amount && <div className="text-green-400 font-semibold">{activity.amount}</div>}
                            </div>
                          )
                        }) : (
                          <p className="text-white/60 text-center py-8">No recent activity</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <h3 className="text-xl font-bold text-white mb-6">Performance</h3>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-white/80">Success Rate</span>
                            <span className="text-green-400 font-semibold">{sellerStats.successRate}%</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all" style={{ width: `${sellerStats.successRate}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-white/80">Average Sale Price</span>
                            <span className="text-cyan-400 font-semibold">${sellerStats.avgSalePrice}</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full w-3/4" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-white/80">Customer Satisfaction</span>
                            <span className="text-yellow-400 font-semibold">{sellerStats.rating}/5</span>
                          </div>
                          <div className="flex gap-1 items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.floor(sellerStats.rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                            <span className="text-white/60 text-sm ml-2">({sellerStats.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'listings' && (
                <motion.div 
                  key="listings" 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex gap-4 justify-between">
                    <div className="flex gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="text"
                          placeholder="Search listings..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 w-64 focus:outline-none focus:border-cyan-400/50"
                        />
                      </div>
                      <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)} 
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => setShowCreateModal(true)} 
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Create Listing
                    </button>
                  </div>

                  <div className="grid gap-6">
                    {listings.length > 0 ? listings.map((listing) => (
                      <div key={listing.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all">
                        <div className="flex gap-6">
                          <div className="relative">
                            <img src={listing.image} alt={listing.title} className="w-24 h-24 rounded-xl object-cover" />
                            {listing.featured && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Crown className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-2">
                              <h3 className="text-lg font-bold text-white">{listing.title}</h3>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(listing.status)}`}>
                                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-white/60">Current Bid</p>
                                <p className="text-white font-semibold">${listing.currentBid}</p>
                              </div>
                              <div>
                                <p className="text-white/60">Starting Bid</p>
                                <p className="text-white font-semibold">${listing.startingBid}</p>
                              </div>
                              <div>
                                <p className="text-white/60">Time Left</p>
                                <p className="text-white font-semibold">{listing.endTime}</p>
                              </div>
                              <div>
                                <p className="text-white/60">Bids</p>
                                <p className="text-white font-semibold">{listing.bids}</p>
                              </div>
                              <div>
                                <p className="text-white/60">Views</p>
                                <p className="text-white font-semibold">{listing.views}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg flex items-center gap-2 hover:bg-cyan-500/30 transition-colors">
                                <Edit3 className="w-4 h-4" />
                                Edit
                              </button>
                              <button className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg flex items-center gap-2 hover:bg-blue-500/30 transition-colors">
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              {listing.status === 'active' && (
                                <button className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg flex items-center gap-2 hover:bg-yellow-500/30 transition-colors">
                                  <Zap className="w-4 h-4" />
                                  Promote
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-20">
                        <Package className="w-16 h-16 text-white/40 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">No Listings Yet</h3>
                        <p className="text-white/60 mb-6">Create your first listing to get started</p>
                        <button 
                          onClick={() => setShowCreateModal(true)}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl inline-flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                        >
                          <Plus className="w-5 h-5" />
                          Create Your First Listing
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {['analytics', 'messages', 'settings'].includes(activeTab) && (
                <motion.div 
                  key={activeTab} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-20"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full mb-6">
                    {tabs.find(t => t.id === activeTab) && 
                      React.createElement(tabs.find(t => t.id === activeTab).icon, { className: "w-10 h-10 text-cyan-300" })
                    }
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{tabs.find(t => t.id === activeTab)?.label}</h3>
                  <p className="text-white/60">Coming soon...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-white/20 p-6 flex justify-between backdrop-blur-md">
                  <h2 className="text-2xl font-bold text-white">Create New Listing</h2>
                  <button 
                    onClick={() => setShowCreateModal(false)} 
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white/60" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">Title</label>
                    <input 
                      type="text" 
                      placeholder="Enter product title..." 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50" 
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Description</label>
                    <textarea 
                      rows="4" 
                      placeholder="Describe your product..." 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 resize-none focus:outline-none focus:border-cyan-400/50" 
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Category</label>
                    <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50">
                      <option value="">Select category...</option>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="jewelry">Jewelry</option>
                      <option value="collectibles">Collectibles</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Starting Bid</label>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50" 
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2">Duration</label>
                      <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50">
                        <option value="1">1 Day</option>
                        <option value="3">3 Days</option>
                        <option value="7">7 Days</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0 bg-slate-800/90 border-t border-white/20 p-6 flex gap-4 backdrop-blur-md">
                  <button 
                    onClick={() => setShowCreateModal(false)} 
                    className="flex-1 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-yellow-500/50 transition-all">
                    <Upload className="w-5 h-5" />
                    Save as Draft
                  </button>
                  <button className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
                    <Zap className="w-5 h-5" />
                    Publish
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SellerDashboard
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { 
  Store, Plus, TrendingUp, DollarSign, Eye, Edit3, Trash2, 
  Clock, Users, Gavel, Package, Star, BarChart3, Calendar,
  Search, Filter, MoreHorizontal, AlertCircle, CheckCircle,
  ArrowUp, ArrowDown, Bell, Settings, LogOut, Crown, Zap,
  Camera, Heart, MessageCircle, Share2, Download, Upload
} from "lucide-react"

function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Mock seller data
  const sellerStats = {
    totalListings: 24,
    activeAuctions: 8,
    soldItems: 156,
    totalEarnings: 12450.75,
    avgSalePrice: 79.81,
    successRate: 94,
    rating: 4.8,
    reviews: 89
  }

  // Mock listings data
  const listings = [
    {
      id: 1,
      title: 'MacBook Pro M3 Max 16"',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=150&h=150&fit=crop',
      currentBid: 1899,
      startingBid: 1200,
      endTime: '2h 45m',
      bids: 23,
      views: 156,
      status: 'active',
      category: 'Electronics',
      featured: true
    },
    {
      id: 2,
      title: 'Vintage Rolex Submariner',
      image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=150&h=150&fit=crop',
      currentBid: 8450,
      startingBid: 5000,
      endTime: '1d 4h',
      bids: 47,
      views: 234,
      status: 'active',
      category: 'Jewelry',
      featured: false
    },
    {
      id: 3,
      title: 'Gaming Setup Bundle',
      image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=150&h=150&fit=crop',
      currentBid: 0,
      startingBid: 800,
      endTime: 'Draft',
      bids: 0,
      views: 0,
      status: 'draft',
      category: 'Electronics',
      featured: false
    },
    {
      id: 4,
      title: 'Designer Handbag Collection',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=150&h=150&fit=crop',
      currentBid: 340,
      startingBid: 150,
      endTime: 'Sold',
      bids: 12,
      views: 89,
      status: 'sold',
      category: 'Fashion',
      featured: false,
      soldPrice: 340,
      soldDate: '2 days ago'
    }
  ]

  // Recent activity
  const recentActivity = [
    { type: 'bid', message: 'New bid on MacBook Pro M3 Max', amount: '$1,899', time: '2 min ago' },
    { type: 'view', message: 'Your Rolex listing was viewed 15 times', time: '1 hour ago' },
    { type: 'sold', message: 'Designer Handbag sold successfully', amount: '$340', time: '2 days ago' },
    { type: 'message', message: 'New question about Gaming Setup', time: '3 hours ago' },
    { type: 'featured', message: 'MacBook Pro promoted to featured', time: '1 day ago' }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10'
      case 'draft': return 'text-yellow-400 bg-yellow-400/10'
      case 'sold': return 'text-blue-400 bg-blue-400/10'
      case 'ended': return 'text-gray-400 bg-gray-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'bid': return Gavel
      case 'view': return Eye
      case 'sold': return CheckCircle
      case 'message': return MessageCircle
      case 'featured': return Star
      default: return Bell
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'listings', label: 'My Listings', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900'>
      {/* Header */}
      <motion.header 
        className='bg-white/10 backdrop-blur-md border-b border-white/20'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-4'>
              <div className='w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center'>
                <Store className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-white'>Seller Dashboard</h1>
                <p className='text-white/60 text-sm'>Manage your BidWaza store</p>
              </div>
            </div>
            
            <div className='flex items-center gap-4'>
              <motion.button
                className='relative p-2 text-white/60 hover:text-white transition-colors'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Bell className='w-6 h-6' />
                <span className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full'></span>
              </motion.button>
              
              <motion.button
                className='px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className='w-5 h-5' />
                New Listing
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='flex gap-8'>
          {/* Sidebar */}
          <motion.div 
            className='w-64 space-y-2'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent className='w-5 h-5' />
                  {tab.label}
                </motion.button>
              )
            })}
          </motion.div>

          {/* Main Content */}
          <div className='flex-1'>
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-8"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Earnings', value: `$${sellerStats.totalEarnings.toLocaleString()}`, icon: DollarSign, color: 'from-green-500 to-emerald-500', change: '+12%' },
                      { label: 'Active Listings', value: sellerStats.activeAuctions, icon: Package, color: 'from-blue-500 to-cyan-500', change: '+3' },
                      { label: 'Items Sold', value: sellerStats.soldItems, icon: TrendingUp, color: 'from-purple-500 to-pink-500', change: '+18%' },
                      { label: 'Seller Rating', value: `${sellerStats.rating}/5`, icon: Star, color: 'from-yellow-500 to-orange-500', change: '+0.2' }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        variants={itemVariants}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex items-center gap-1 text-green-400 text-sm">
                            <ArrowUp className="w-4 h-4" />
                            {stat.change}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-white/60 text-sm">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Recent Activity */}
                    <motion.div 
                      variants={itemVariants}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                    >
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Bell className="w-6 h-6" />
                        Recent Activity
                      </h3>
                      <div className="space-y-4">
                        {recentActivity.map((activity, index) => {
                          const IconComponent = getActivityIcon(activity.type)
                          return (
                            <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white text-sm">{activity.message}</p>
                                <p className="text-white/40 text-xs">{activity.time}</p>
                              </div>
                              {activity.amount && (
                                <div className="text-green-400 font-semibold">{activity.amount}</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div 
                      variants={itemVariants}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                    >
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6" />
                        Performance
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white/80">Success Rate</span>
                            <span className="text-green-400 font-semibold">{sellerStats.successRate}%</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${sellerStats.successRate}%` }}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white/80">Average Sale Price</span>
                            <span className="text-cyan-400 font-semibold">${sellerStats.avgSalePrice}</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full w-3/4 transition-all duration-500" />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white/80">Customer Satisfaction</span>
                            <span className="text-yellow-400 font-semibold">{sellerStats.rating}/5</span>
                          </div>
                          <div className="flex gap-1">
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
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <motion.div
                  key="listings"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-6"
                >
                  {/* Filters */}
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="text"
                          placeholder="Search listings..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 w-64"
                        />
                      </div>
                      
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="sold">Sold</option>
                        <option value="ended">Ended</option>
                      </select>
                    </div>
                    
                    <motion.button
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-5 h-5" />
                      Create Listing
                    </motion.button>
                  </div>

                  {/* Listings Grid */}
                  <div className="grid gap-6">
                    {listings.map((listing, index) => (
                      <motion.div
                        key={listing.id}
                        variants={itemVariants}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                      >
                        <div className="flex gap-6">
                          <div className="relative">
                            <img
                              src={listing.image}
                              alt={listing.title}
                              className="w-24 h-24 rounded-xl object-cover"
                            />
                            {listing.featured && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Crown className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-bold text-white">{listing.title}</h3>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(listing.status)}`}>
                                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                </span>
                                <div className="relative">
                                  <motion.button 
                                    className="p-2 text-white/60 hover:text-white transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <MoreHorizontal className="w-5 h-5" />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                              <div>
                                <p className="text-white/60">Current Bid</p>
                                <p className="text-white font-semibold">
                                  {listing.currentBid > 0 ? `$${listing.currentBid}` : 'No bids'}
                                </p>
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
                                <p className="text-white font-semibold flex items-center gap-1">
                                  <Gavel className="w-4 h-4" />
                                  {listing.bids}
                                </p>
                              </div>
                              <div>
                                <p className="text-white/60">Views</p>
                                <p className="text-white font-semibold flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {listing.views}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              <motion.button 
                                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-colors flex items-center gap-2"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Edit3 className="w-4 h-4" />
                                Edit
                              </motion.button>
                              <motion.button 
                                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-2"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </motion.button>
                              {listing.status === 'active' && (
                                <motion.button 
                                  className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-colors flex items-center gap-2"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Zap className="w-4 h-4" />
                                  Promote
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Other tabs content can be added here */}
              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-6"
                >
                  <div className="text-center py-20">
                    <BarChart3 className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h3>
                    <p className="text-white/60">Detailed analytics coming soon...</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'messages' && (
                <motion.div
                  key="messages"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-6"
                >
                  <div className="text-center py-20">
                    <MessageCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Messages</h3>
                    <p className="text-white/60">No new messages</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-6"
                >
                  <div className="text-center py-20">
                    <Settings className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Seller Settings</h3>
                    <p className="text-white/60">Manage your seller preferences</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard
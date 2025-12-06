import React, { useState } from 'react'
import { Crown, Edit3, Eye, Trash2, MoreVertical, Plus, Minus, Trophy, Gavel, Clock, UserPlus } from "lucide-react"
import BidHistoryModal from './BidHistoryModal';




function ListingCard({ listing, onDelete, onStatusChange, onStockUpdate, onEdit, bidHistory }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [stock, setStock] = useState(listing.stock || 0)
  const [updatingStock, setUpdatingStock] = useState(false)
  const [showBidModal, setShowBidModal] = useState(false)
  console.log("listing received",listing)
  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-400 bg-green-400/10',
      inactive: 'text-yellow-400 bg-yellow-400/10',
      sold: 'text-blue-400 bg-blue-400/10',
      expired: 'text-gray-400 bg-gray-400/10'
    }
    return colors[status?.toLowerCase()] || 'text-gray-400 bg-gray-400/10'
  }

  const getProductTypeBadge = (type) => {
    const badges = {
      AUCTION: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      REGISTRATION: 'bg-green-500/20 text-green-300 border-green-500/50',
      DIRECT_SELL: 'bg-blue-500/20 text-blue-300 border-blue-500/50'
    }
    const labels = {
      AUCTION: 'Auction',
      REGISTRATION: 'Registration',
      DIRECT_SELL: 'Direct Sale'
    }
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${badges[type] || badges.DIRECT_SELL}`}>
        {labels[type] || 'Direct Sale'}
      </span>
    )
  }

  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(listing.id, newStatus)
    }
    setShowDropdown(false)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      if (onDelete) {
        onDelete(listing.id)
      }
    }
    setShowDropdown(false)
  }

  const handleStockChange = async (change) => {
    const newStock = Math.max(0, stock + change)
    setStock(newStock)
    
    if (onStockUpdate) {
      setUpdatingStock(true)
      await onStockUpdate(listing.id, newStock)
      setUpdatingStock(false)
    }
  }

  const isDirectSell = listing.productType === 'DIRECT_SELL'
  const isAuction = listing.productType === 'AUCTION' || listing.productType === 'REGISTRATION'
  const isSold = listing.status?.toLowerCase() === 'sold'
  const primaryImage = listing.images?.find(img => img.isPrimary)?.url || listing.images?.[0]?.url || listing.image

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all">
        <div className="flex gap-6">
          {/* Image Gallery */}
          <div className="relative flex-shrink-0">
            <img 
              src={primaryImage} 
              alt={listing.title} 
              className="w-32 h-32 rounded-xl object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/150?text=No+Image'
              }}
            />
            {listing.images && listing.images.length > 1 && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                +{listing.images.length - 1} more
              </div>
            )}
            {listing.featured && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white truncate">{listing.title}</h3>
                  {getProductTypeBadge(listing.productType)}
                </div>
                <p className="text-white/60 text-sm mt-1 line-clamp-2">{listing.description}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(listing.status)}`}>
                  {listing.status?.charAt(0).toUpperCase() + listing.status?.slice(1)}
                </span>
                
                {/* Dropdown Menu - Hide for sold auctions */}
                {!(isAuction && isSold) && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-white" />
                    </button>
                    
                    {showDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowDropdown(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/20 rounded-xl shadow-xl z-20 overflow-hidden">
                          <div className="py-1">
                            {!isAuction && (
                              <>
                                <div className="px-3 py-2 text-xs text-white/60 font-semibold">Change Status</div>
                                <button 
                                  onClick={() => handleStatusChange('active')}
                                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                                >
                                  Mark as Active
                                </button>
                                <button 
                                  onClick={() => handleStatusChange('inactive')}
                                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                                >
                                  Mark as Inactive
                                </button>
                                <div className="border-t border-white/10 my-1"></div>
                              </>
                            )}
                            <button 
                              onClick={handleDelete}
                              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Listing
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className={`grid ${isDirectSell ? 'grid-cols-3' : isAuction && isSold ? 'grid-cols-4' : 'grid-cols-5'} gap-4 text-sm mb-4`}>
              {isDirectSell ? (
                <>
                  <div>
                    <p className="text-white/60">Price</p>
                    <p className="text-white font-semibold text-lg">रु{listing.price?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Category</p>
                    <p className="text-white font-semibold">{listing.category}</p>
                  </div>
                  <div>
                    <p className="text-white/60 mb-1">Stock</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStockChange(-1)}
                        disabled={stock === 0 || updatingStock}
                        className="p-1 bg-white/10 hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                      <span className="text-white font-semibold min-w-[2rem] text-center">
                        {stock}
                      </span>
                      <button
                        onClick={() => handleStockChange(1)}
                        disabled={updatingStock}
                        className="p-1 bg-white/10 hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                </>
              ) : isAuction && isSold ? (
                <>
                  <div>
                    <p className="text-white/60">Starting Bid</p>
                    <p className="text-white font-semibold">रु{listing.startingPrice || '0'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      Winning Bid
                    </p>
                    <p className="text-yellow-400 font-bold text-lg">रु{listing.winningBid?.toLocaleString() || listing.currentPrice?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Winner</p>
                    <p className="text-white font-semibold truncate">{listing.winnerName || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Total Bids</p>
                    <p className="text-white font-semibold">{listing.totalBids || 0}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-white/60">Current Bid</p>
                    <p className="text-white font-semibold">रु{listing.currentPrice?.toLocaleString() || listing.startingPrice?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Starting Price</p>
                    <p className="text-white font-semibold">रु{listing.startingPrice?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Status
                    </p>
                    <p className="text-white font-semibold">
                      {new Date(listing.endTime) > new Date() ? 'Live' : 'Ended'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Bids</p>
                    <p className="text-white font-semibold">{listing.totalBids || 0}</p>
                  </div>
                  <div>
                    <p className="text-white/60">Category</p>
                    <p className="text-white font-semibold">{listing.category}</p>
                  </div>
                </>
              )}
            </div>

            {/* Winner Badge for Sold Auctions */}
            {isAuction && isSold && listing.winnerName && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-yellow-300 text-sm font-semibold">Auction Won</p>
                  <p className="text-yellow-200/80 text-xs truncate">
                    Winner: {listing.winnerName} • रु{listing.winningBid?.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isSold && (
                <button 
                  onClick={() => onEdit && onEdit(listing)}
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg flex items-center gap-2 hover:bg-cyan-500/30 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg flex items-center gap-2 hover:bg-blue-500/30 transition-colors">
                <Eye className="w-4 h-4" />
                View Details
              </button>
              {listing.images && listing.images.length > 0 && (
                <button className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg flex items-center gap-2 hover:bg-purple-500/30 transition-colors">
                  <Eye className="w-4 h-4" />
                  Gallery ({listing.images.length})
                </button>
              )}
              {isAuction && !isSold && (
                <button 
                  onClick={(e) => {
                          e.stopPropagation();
                          console.log("Clicked");
                          setShowBidModal(true);
                        }}

                  className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg flex items-center gap-2 hover:bg-orange-500/30 transition-colors"
                >
                  <Gavel className="w-4 h-4" />
                  View Bids ({listing.totalBids || 0})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bid History Modal */}
      <BidHistoryModal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        listing={listing}
        bidHistory={bidHistory}
      />
    </>
  )
}

export default ListingCard
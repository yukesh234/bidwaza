import React, { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { Search, Plus, Package, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import ListingCard from '../../Components/seller/ListingCard'
import { getListing, updateStock } from '../../services/sellerservices.js' // Adjust import path as needed
import toast from 'react-hot-toast'

function Listing({ onCreateClick, onDelete, onStatusChange }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [listings, setListings] = useState([])
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const itemsPerPage = 5

  // Fetch listings from API
  const fetchListings = async (page, search, status) => {
    setLoading(true)
    try {
      const result = await getListing(page, itemsPerPage, search, status)
      
      if (result.success) {
        // Transform API data to match component expectations
        const transformedListings = result.products.map(product => ({
          id: product.itemId,
          title: product.title,
          description: product.description,
          category: product.category,
          stock: product.stock,
          productType: product.productType,
          price: product.amount,
          createdAt: product.createdAt,
          status: product.status.toLowerCase(), // Convert ACTIVE to active
          images: product.images
        }))
        
        setListings(transformedListings)
        setPagination(result.pagination)
      } else {
        console.error('Failed to fetch listings:', result.message)
        setListings([])
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch listings on component mount and when filters change
  useEffect(() => {
    fetchListings(currentPage, searchTerm, filterStatus)
  }, [currentPage, searchTerm, filterStatus])

  // Reset to page 1 when filters change
  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value) => {
    setFilterStatus(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle delete with refetch
  const handleDeleteListing = async (listingId) => {
    if (onDelete) {
      await onDelete(listingId)
      // Refetch current page
      fetchListings(currentPage, searchTerm, filterStatus)
    }
  }

  // Handle status change with refetch
  const handleStatusChangeListing = async (listingId, newStatus) => {
    if (onStatusChange) {
      await onStatusChange(listingId, newStatus)
      // Refetch current page
      fetchListings(currentPage, searchTerm, filterStatus)
    }
  }

  // Handle stock update

const handleStockUpdate = async (listingId, newStock) => {
  try {
    const response = await updateStock(newStock, listingId);
    if (response.success) {
      toast.success(response.message);

      // Update local listing immediately
      setListings(prevListings =>
        prevListings.map(listing => {
          if (listing.id === listingId) {
            // determine new status instantly
            const updatedStatus = newStock === 0 ? 'sold' : 'active';
            return { 
              ...listing, 
              stock: newStock, 
              status: updatedStatus 
            };
          }
          return listing;
        })
      );
    } else {
      toast.error(response.message);
    }
  } catch (error) {
    console.error(`update stock error: ${error}`);
    toast.error("Failed to update stock");
    // optional refetch to restore correct state
    fetchListings(currentPage, searchTerm, filterStatus);
  }
};


  const { totalCount, totalPages } = pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + listings.length, totalCount)

  return (
    <motion.div 
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 w-64 focus:outline-none focus:border-cyan-400/50"
            />
          </div>
          <select 
            value={filterStatus} 
            onChange={(e) => handleStatusChange(e.target.value)} 
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/50"
          >
            <option value="all" className="bg-slate-800 text-white">All Status</option>
            <option value="active"  className="bg-slate-800 text-white">Active</option>
            <option value="inactive" className="bg-slate-800 text-white">Inactive</option>
            <option value="sold"className="bg-slate-800 text-white">Sold</option>
            <option value="expired" className="bg-slate-800 text-white">Expired</option>
          </select>
        </div>
        <button 
          onClick={onCreateClick} 
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Listing
        </button>
      </div>

      {/* Results count */}
      {totalCount > 0 && !loading && (
        <p className="text-white/60 text-sm">
          Showing {startIndex + 1}-{endIndex} of {totalCount} listings
        </p>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {listings.length > 0 ? listings.map((listing) => (
            <ListingCard 
              key={listing.id} 
              listing={listing}
              onDelete={handleDeleteListing}
              onStatusChange={handleStatusChangeListing}
              onStockUpdate={handleStockUpdate}
            />
          )) : (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No Matching Listings' : 'No Listings Yet'}
              </h3>
              <p className="text-white/60 mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first listing to get started'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button 
                  onClick={onCreateClick}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl inline-flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Listing
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              const showPage = 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)

              if (!showPage && page === currentPage - 2) {
                return <span key={page} className="px-3 py-2 text-white/40">...</span>
              }
              if (!showPage && page === currentPage + 2) {
                return <span key={page} className="px-3 py-2 text-white/40">...</span>
              }
              if (!showPage) return null

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {page}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default Listing
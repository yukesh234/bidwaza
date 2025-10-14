import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import SellerNavbar from '../../Components/seller/SellerNavbar'
import SellerSidebar from '../../Components/seller/SellerSidebar'
import Overview from './Overview'
import Listing from './Listing'
import CommingSoon from './CommingSoon'
import CreateListingModal from '../../Components/seller/CreateListingModal'
import { TrendingUp, MessageCircle, Settings,Package
 } from "lucide-react"
import toast from 'react-hot-toast'
import Order from './Order'
import {updatestatus, getSellerStats} from '../../services/sellerservices.js'

function SellerDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false)
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
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    // TODO: Fetch seller stats from API
    // fetchSellerStats().then(data => setSellerStats(data))
    
    fetchSellerStats();
    
    // TODO: Fetch recent activity from API
    // fetchRecentActivity().then(data => setRecentActivity(data))
  }, [])

  const fetchSellerStats = async() =>
  {
    try {
      const response = await getSellerStats();
      if(response.success)
      {
        console.log("fetched successfully");
        setSellerStats(response.data)
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Handle listing deletion
  const handleDeleteListing = async (listingId) => {
    try {
      // TODO: Call your API to delete the listing
      // await deleteListingAPI(listingId)
      
      toast.success('Listing deleted successfully')
    } catch (error) {
      console.error('Error deleting listing:', error)
      toast.error('Failed to delete listing')
    }
  }

  // Handle status change
  const handleStatusChange = async (listingId, newStatus) => {
    try {
      // TODO: Call your API to update the listing status
      // await updateListingStatusAPI(listingId, newStatus)
      const response = await updatestatus(newStatus.toUpperCase(), listingId)
      if(response.success)
      {
         console.log(listingId, newStatus)
        toast.success(`Listing status updated to ${newStatus}`)
      }
     
    } catch (error) {
      console.error('Error updating listing status:', error)
      toast.error('Failed to update listing status')
    }
  }

  // Handle modal close with refresh
  const handleModalClose = () => {
    setShowCreateModal(false)
    // Trigger refresh in Listing component
    if (window.refreshListings) {
      window.refreshListings()
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900'>
      <SellerNavbar onCreateClick={() => setShowCreateModal(true)} />

      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='flex gap-8 items-start'>
          <SellerSidebar />

          <main className='flex-1 min-w-0'>
            <Routes>
              <Route path="/" element={<Navigate to="/seller/overview" replace />} />
              <Route 
                path="/overview" 
                element={
                  <Overview 
                    sellerStats={sellerStats} 
                    recentActivity={recentActivity} 
                  />
                } 
              />
              <Route 
                path="/listings" 
                element={
                  <Listing 
                    onCreateClick={() => setShowCreateModal(true)}
                    onDelete={handleDeleteListing}
                    onStatusChange={handleStatusChange}
                  />
                } 
              />
              <Route 
                path="/analytics" 
                element={<CommingSoon icon={TrendingUp} title="Analytics" />} 
              />
              <Route 
                path="/messages" 
                element={<CommingSoon icon={MessageCircle} title="Messages" />} 
              />
              <Route 
                path="/orders" 
                element={<Order icon={Package} title="Orders" />} 
              />
              <Route 
                path="/settings" 
                element={<CommingSoon icon={Settings} title="Settings" />} 
              />
              
            </Routes>
            
          </main>
        </div>
      </div>

      <CreateListingModal 
        isOpen={showCreateModal} 
        onClose={handleModalClose}
      />
    </div>
  )
}

export default SellerDashboard
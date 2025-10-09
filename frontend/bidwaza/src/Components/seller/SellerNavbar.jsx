import React, { useState, useEffect, useRef } from 'react'
import { Store, Plus, Bell, ChevronDown, LogOut, ShoppingBag } from "lucide-react"
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/Authcontext'

function SellerNavbar({ onCreateClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const { logout, user: User } = useAuth()
  
  const user = {
    firstName: User?.FIRST_NAME ?? "John",
    lastName: User?.LAST_NAME ?? "Doe",
    email: User?.EMAIL ?? "john.doe@example.com",
    profilePicture: User?.PROFILE_PICTURE_URL
  }

  async function handleLogout()
  {
    await logout();
    navigate("/");
      window.location.reload();

  }

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

  return (
    <header className='bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-6 py-4'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center -ml-10'>
              <Store className='w-6 h-6 text-white' />
            </div>
            <div >
              <h1 className='text-2xl font-bold text-white'>Seller Dashboard</h1>
              <p className='text-white/60 text-sm'>Manage your store</p>
            </div>
          </div>
          
          <div className='flex items-center gap-4'>
            <button
              onClick={onCreateClick}
              className='px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all'
            >
              <Plus className='w-5 h-5' />
              New Listing
            </button>

            <button className='relative p-2 text-white/60 hover:text-white transition-colors'>
              <Bell className='w-6 h-6' />
              <span className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full'></span>
            </button>

            <div className='relative -mr-12' ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className='flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full hover:border-cyan-400/50 transition-all'
              >
                <div className='relative '>
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
                <div className='absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-md border border-cyan-400/20 rounded-2xl shadow-2xl overflow-hidden'>
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
                      onClick={() => navigate("/")}
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
                      onClick={handleLogout}
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
    </header>
  )
}

export default SellerNavbar
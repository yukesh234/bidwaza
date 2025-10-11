import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/Authcontext.jsx'
import { 
  ChevronDown, 
  User, 
  Wallet, 
  Store, 
  LogOut, 
  Settings,
  Crown,
  Search,
  ShoppingCart,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCart } from '../../services/userservices.js'

function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    
    const { logout, isAuthenticated, user } = useAuth();
   
    
    // Fetch cart count
    useEffect(() => {
        const fetchCartCount = async () => {
            if (isAuthenticated) {
                try {
                    const response = await getCart();
                    if (response.success && response.summary) {
                        setCartCount(response.summary.itemCount || 0);
                    }
                } catch (error) {
                    console.error("Error fetching cart count:", error);
                }
            }
        };
        
        fetchCartCount();
        
        // Refresh cart count every 30 seconds
        const interval = setInterval(fetchCartCount, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);
    
    // Safe name handling
    const getFullName = () => {
        if (!user) return "User";
        const firstName = user.FIRST_NAME || user.first_name || "";
        const lastName = user.LAST_NAME || user.last_name || "";
        
        if (!firstName && !lastName) return "User";
        if (!firstName) return lastName;
        if (!lastName) return firstName;
        
        return `${firstName} ${lastName}`;
    };
    
    const name = getFullName();
    
    // Get user initials for avatar fallback
    const getInitials = () => {
        if (!user) return "U";
        const firstName = user.FIRST_NAME || user.first_name || "";
        const lastName = user.LAST_NAME || user.last_name || "";
        
        if (!firstName && !lastName) return "U";
        if (!firstName) return lastName.charAt(0).toUpperCase();
        if (!lastName) return firstName.charAt(0).toUpperCase();
        
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Dropdown menu items
    const dropdownItems = [
        {
            name: "Profile",
            icon: User,
            path: "/uploadpfp",
            description: "Manage your account"
        },
        {
            name: "Wallet",
            icon: Wallet,
            path: "/wallet",
            description: "View your balance"
        },
        {
            name: "Switch to Seller",
            icon: Store,
            path: "/seller/overview",
            description: "Start selling"
        },
        {
            name: "Settings",
            icon: Settings,
            path: "/settings",
            description: "App preferences"
        }
    ];

    const handleLogout = () => {
        setIsDropdownOpen(false);
        logout();
          window.location.reload();
    };

    // Handle cart click
    const handleCartClick = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
        } else {
            navigate("/cart");
        }
    };

    // Auth Modal Component
    const AuthModal = () => (
        <AnimatePresence>
            {showAuthModal && (
                <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAuthModal(false)}
                >
                    <motion.div
                        className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 relative"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Please Log In</h2>
                            <p className="text-gray-400 mb-8">
                                You need to log in to access your cart and make purchases.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600"
                                    onClick={() => {
                                        setShowAuthModal(false);
                                        navigate('/login');
                                    }}
                                >
                                    Login
                                </button>
                                <button
                                    className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
                                    onClick={() => {
                                        setShowAuthModal(false);
                                        navigate('/signup');
                                    }}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <div className='relative z-[1000]'>
                {/* Glass morphism navbar */}
                <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl mx-4 mt-4 p-4 shadow-2xl relative z-[1001]'>
                    
                    <div className='flex justify-between items-center'>
                        {/* Left side - Logo */}
                        <div className='flex py-1.5 items-center gap-8'>
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    isActive
                                        ? "text-cyan-300 text-xl font-bold relative after:content-[''] after:absolute after:w-full after:h-0.5 after:bg-cyan-300 after:left-0 after:-bottom-1 after:rounded-full transition-all duration-300"
                                        : "text-white/80 text-xl hover:text-cyan-300 transition-all duration-300 relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-cyan-300 after:left-0 after:-bottom-1 after:rounded-full hover:after:w-full after:transition-all after:duration-300"
                                }
                            >
                                <div className='flex items-center gap-2'>
                                    <Crown className='w-6 h-6' />
                                    Bidwaza
                                </div>
                            </NavLink>
                        </div>

                        {/* Center - Search Bar */}
                        <div className='flex-1 max-w-2xl mx-8'>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full pl-12 pr-6 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:outline-none text-white placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Right side - Cart & User */}
                        <div className='flex items-center gap-4'>
                            {/* Shopping Cart */}
                            <motion.button
                                className="relative p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 cursor-pointer transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCartClick}
                            >
                                <ShoppingCart className="w-6 h-6 text-white" />
                                {cartCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-gray-900"
                                    >
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </motion.span>
                                )}
                            </motion.button>

                            {/* User Profile or Login/Signup */}
                            {isAuthenticated ? (
                                <div className='relative z-[1002]' ref={dropdownRef}>
                                    {/* User Profile Button */}
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className='flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/30 hover:border-cyan-400/50 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 group'
                                    >
                                        {/* Profile Picture or Initials */}
                                        <div className='relative'>
                                            {user?.PROFILE_PICTURE_URL ? (
                                                <img 
                                                    src={user.PROFILE_PICTURE_URL} 
                                                    alt="Profile" 
                                                    className='w-8 h-8 rounded-full object-cover border-2 border-cyan-400/50'
                                                />
                                            ) : (
                                                <div className='w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm'>
                                                    {getInitials()}
                                                </div>
                                            )}
                                            {/* Online indicator */}
                                            <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white/20 rounded-full'></div>
                                        </div>
                                        
                                        {/* User name */}
                                        <div className='flex flex-col items-start'>
                                            <span className='text-white font-medium text-sm'>
                                                {user?.FIRST_NAME || user?.first_name || "User"}
                                            </span>
                                            <span className='text-cyan-300 text-xs'>
                                                Welcome back!
                                            </span>
                                        </div>
                                        
                                        {/* Dropdown arrow */}
                                        <ChevronDown 
                                            className={`w-4 h-4 text-white/60 transition-transform duration-300 ${
                                                isDropdownOpen ? 'rotate-180' : ''
                                            }`} 
                                        />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className='absolute right-0 mt-2 w-72 bg-gray-900/95 backdrop-blur-md border border-cyan-400/20 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden z-[9999] animate-in slide-in-from-top-2 duration-200'>
                                            {/* User info header */}
                                            <div className='px-6 py-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-400/20'>
                                                <div className='flex items-center gap-3'>
                                                    <div className='relative'>
                                                        {user?.PROFILE_PICTURE_URL ? (
                                                            <img 
                                                                src={user.PROFILE_PICTURE_URL} 
                                                                alt="Profile" 
                                                                className='w-12 h-12 rounded-full object-cover border-2 border-cyan-400/50'
                                                            />
                                                        ) : (
                                                            <div className='w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg'>
                                                                {getInitials()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className='text-white font-semibold text-base'>{name}</h3>
                                                        <p className='text-cyan-300 text-sm'>{user?.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Menu items */}
                                            <div className='py-2'>
                                                {dropdownItems.map((item, index) => (
                                                    <NavLink
                                                        key={index}
                                                        to={item.path}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                        className='flex items-center gap-4 px-6 py-3 hover:bg-cyan-500/10 hover:border-r-4 hover:border-cyan-400 transition-all duration-200 group'
                                                    >
                                                        <div className='p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-200'>
                                                            <item.icon className='w-5 h-5 text-cyan-300' />
                                                        </div>
                                                        <div className='flex-1'>
                                                            <p className='text-white font-medium text-sm'>{item.name}</p>
                                                            <p className='text-white/60 text-xs'>{item.description}</p>
                                                        </div>
                                                    </NavLink>
                                                ))}
                                                
                                                {/* Divider */}
                                                <div className='border-t border-cyan-400/20 my-2'></div>
                                                
                                                {/* Logout button */}
                                                <button
                                                    onClick={handleLogout}
                                                    className='w-full flex items-center gap-4 px-6 py-3 hover:bg-red-500/10 hover:border-r-4 hover:border-red-400 transition-all duration-200 group'
                                                >
                                                    <div className='p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg group-hover:from-red-500/30 group-hover:to-pink-500/30 transition-all duration-200'>
                                                        <LogOut className='w-5 h-5 text-red-300' />
                                                    </div>
                                                    <div className='flex-1 text-left'>
                                                        <p className='text-white font-medium text-sm'>Logout</p>
                                                        <p className='text-white/60 text-xs'>Sign out of your account</p>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Login/Signup buttons for non-authenticated users
                                <div className='flex items-center gap-3'>
                                    <NavLink
                                        to="/login"
                                        className={({ isActive }) =>
                                            isActive
                                                ? "px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full shadow-lg transform scale-105 transition-all duration-300"
                                                : "px-6 py-2 text-white/80 hover:text-white font-medium rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-300 hover:shadow-lg"
                                        }
                                    >
                                        Login
                                    </NavLink>
                                    <NavLink
                                        to="/signup"
                                        className={({ isActive }) =>
                                            isActive
                                                ? "px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full shadow-lg transform scale-105 transition-all duration-300"
                                                : "px-6 py-2 text-white/80 hover:text-white font-medium rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-300 hover:shadow-lg"
                                        }
                                    >
                                        Signup
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Subtle glow effect */}
                <div className='absolute top-4 left-4 right-4 h-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-xl -z-10'></div>
            </div>

            {/* Auth Modal */}
            <AuthModal />
        </>
    )
}

export default Navbar
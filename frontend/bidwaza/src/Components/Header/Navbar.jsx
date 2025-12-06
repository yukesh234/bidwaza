import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../Context/Authcontext.jsx'
import { 
  ChevronDown, 
  User, 
  Wallet, 
  Store, 
  LogOut, 
  Search,
  ShoppingCart,
  X,
  Package
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCart } from '../../services/userservices.js'

function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const { logout, isAuthenticated, user, balance } = useAuth();
//    console.log("Navbar user:", user);
    // Initialize search query from URL params
    useEffect(() => {
        const query = searchParams.get('search');
        if (query) {
            setSearchQuery(query);
        } else {
            setSearchQuery('');
        }
    }, [searchParams]);

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
        const interval = setInterval(fetchCartCount, 3000);
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

    // LIVE SEARCH: Search as user types with debounce
    useEffect(() => {
        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Only search if there's a query or if clearing search
        if (searchQuery.trim() || searchParams.get('search')) {
            // Debounce: wait 500ms after user stops typing
            searchTimeoutRef.current = setTimeout(() => {
                if (searchQuery.trim()) {
                    // console.log('🔍 Live search triggered:', searchQuery.trim());
                    navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
                } else {
                    // If search is empty, go back to home
                    // console.log('🧹 Search cleared');
                    navigate('/');
                }
            }, 300); // 500ms debounce delay
        }

        // Cleanup timeout on unmount
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, navigate]);

    // Handle search submit (when Enter is pressed)
    const handleSearch = (e) => {
        e.preventDefault();
        
        // Clear timeout since we're submitting immediately
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.trim()) {
            // console.log('⚡ Instant search (Enter pressed):', searchQuery.trim());
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/');
        }
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
        navigate('/');
    };

    // Dropdown menu items
    const dropdownItems = [
        {
            name: "Profile",
            icon: User,
            path: "/Profile",
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
            name: "Orders",
            icon: Package,
            path: "/orders",
            description: "View order history"
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
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
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
            {/* Fixed navbar with proper z-index */}
            <div className='fixed top-0 left-0 right-0 z-[100]'>
                {/* Glass morphism navbar */}
                <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl mx-4 mt-4 p-4 shadow-2xl'>
                    
                    <div className='flex justify-between items-center gap-4'>
                        {/* Left side - Logo */}
                        <NavLink
                            to="/"
                            className="text-white/80 hover:text-cyan-300 transition-all duration-300 flex-shrink-0"
                        >
                            <div className='flex items-center gap-2'>
                                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">B</span>
                                </div>
                                <span className="text-xl font-bold hidden sm:block">Bidwaza</span>
                            </div>
                        </NavLink>

                        {/* Center - Search Bar with Live Search */}
                        <form onSubmit={handleSearch} className='flex-1 max-w-2xl'>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products... (type to search)"
                                    className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:outline-none text-white placeholder:text-gray-400"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Right side - Cart & User */}
                        <div className='flex items-center gap-3 flex-shrink-0'>
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

                            {/* Wallet Balance */}
                            {isAuthenticated && (
                                <motion.button
                                    onClick={() => navigate("/wallet")}
                                    className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-400/30 hover:border-green-400/50 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Wallet className="w-5 h-5 text-green-300" />
                                    <div className="flex flex-col items-start">
                                        <span className="text-white font-medium text-sm">
                                            रु{balance ? balance.toLocaleString() : "0"}
                                        </span>
                                        <span className="text-green-300 text-xs">Balance</span>
                                    </div>
                                </motion.button>
                            )}

                            {/* User Profile or Login/Signup */}
                            {isAuthenticated ? (
                                <div className='relative' ref={dropdownRef}>
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
                                        
                                        {/* User name - hidden on mobile */}
                                        <div className='hidden sm:flex flex-col items-start'>
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

                                    {/* Dropdown Menu - Higher z-index */}
                                    {isDropdownOpen && (
                                        <div className='absolute right-0 mt-2 w-72 bg-gray-900/95 backdrop-blur-md border border-cyan-400/20 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden z-[200] animate-in slide-in-from-top-2 duration-200'>
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
                                                ? "hidden sm:block px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full shadow-lg transform scale-105 transition-all duration-300"
                                                : "hidden sm:block px-6 py-2 text-white/80 hover:text-white font-medium rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-300 hover:shadow-lg"
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
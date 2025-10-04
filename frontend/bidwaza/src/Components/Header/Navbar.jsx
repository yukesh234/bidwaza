import React, { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../Context/Authcontext'
import { 
  ChevronDown, 
  User, 
  Wallet, 
  Store, 
  LogOut, 
  Settings,
  Crown
} from 'lucide-react'

function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    const navelements = [
        { name: "Login", path: "/login" },
        { name: "Signup", path: "/signup" }
    ]
    
    const { logout, isAuthenticated, user } = useAuth();
    // console.log(user);
    // Safe name handling - handle undefined/null values
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
    
    // Get user initials for avatar fallback - safe handling
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

    // Dropdown menu items (only show when authenticated)
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
            path: "/seller-dashboard",
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
    };

    // console.log(isAuthenticated);
    // console.log(user);
    // console.log(name);
    console.log(user)
    return (
       
        <div className='relative z-[1000]'>
            {/* Glass morphism navbar */}
            <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl mx-4 mt-4 p-4 shadow-2xl flex justify-between items-center relative z-[1001]'>
                
                {/* Left side */}
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
                            MarketPlace
                        </div>
                    </NavLink>
                </div>

                {/* Right side */}
                <div className='flex items-center gap-4'>
                    {isAuthenticated ? (
                        <div className='relative z-[1002]' ref={dropdownRef}>
                            {/* User Profile Button */}
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className='flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/30 hover:border-cyan-400/50 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 group'
                            >
                                {/* Profile Picture or Initials */}
                                <div className='relative'>
                                    {user?.PROFILE_PICTURE_URL? (
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
                        navelements.map((element, index) => (
                            <NavLink
                                key={index}
                                to={element.path}
                                className={({ isActive }) =>
                                    isActive
                                        ? "px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full shadow-lg transform scale-105 transition-all duration-300"
                                        : "px-6 py-2 text-white/80 hover:text-white font-medium rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-300 hover:shadow-lg"
                                }
                            >
                                {element.name}
                            </NavLink>
                        ))
                    )}
                </div>
            </div>
            
            {/* Subtle glow effect */}
            <div className='absolute top-4 left-4 right-4 h-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-xl -z-10'></div>
        </div>
    )
}

export default Navbar
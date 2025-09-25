import React, { useState } from 'react'
import { motion } from "framer-motion"
import { 
  UserPlus, Mail, Lock, User, ArrowRight, Loader, MoveLeft, Eye, EyeOff, 
  ShoppingCart, Store, Heart, Gavel, CheckCircle
} from "lucide-react"
import { NavLink, Link,useNavigate } from 'react-router-dom'
import {useAuth} from '../../Context/Authcontext.jsx'
import toast from 'react-hot-toast'
function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    interests: []
  })
  const {sendVerificationCode, loading} = useAuth();
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [errors, setErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
  const Navigate = useNavigate();

  // Interest options for BidWaza
  const interestOptions = [
    { id: 'buying', label: 'Buying Items', icon: ShoppingCart, color: 'from-blue-500 to-purple-500' },
    { id: 'selling', label: 'Selling Items', icon: Store, color: 'from-green-500 to-emerald-500' },
    { id: 'both', label: 'Both Buying & Selling', icon: Gavel, color: 'from-cyan-500 to-blue-500' },
    { id: 'Bidding', label: 'Biddin on items', icon: Heart, color: 'from-pink-500 to-rose-500' }
  ]

  //handing submit


  // Calculate password strength - FIXED VERSION
  const calculatePasswordStrength = (password) => {
    let strength = 0
    
    // Check length (at least 8 characters)
    if (password.length >= 8) strength++
    
    // Check for uppercase letters
    if (/[A-Z]/.test(password)) strength++
    
    // Check for lowercase letters  
    if (/[a-z]/.test(password)) strength++
    
    // Check for numbers
    if (/\d/.test(password)) strength++
    
    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    console.log('Password:', password, 'Strength:', strength) // Debug log
    return strength
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Update password strength when password changes
    if (name === 'password') {
      const newStrength = calculatePasswordStrength(value)
      setPasswordStrength(newStrength)
    }

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  // Handle interest selection
  const handleInterestToggle = (interestId) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }))
  }

  // Form validation
  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return
    }
 
  else{
    const res = await sendVerificationCode(formData.email);
    if(res.success)
      toast.success(res.message || "Verification code sent to your email");     
    Navigate('/Verification', {state: {formData}})
    console.log(formData.email);
  }
  }
  // Get password strength info - FIXED VERSION
  const getPasswordStrengthInfo = () => {
    const strengthLevels = [
      { color: 'bg-gray-400', text: 'No Password', textColor: 'text-gray-400' },
      { color: 'bg-red-500', text: 'Very Weak', textColor: 'text-red-400' },
      { color: 'bg-orange-500', text: 'Weak', textColor: 'text-orange-400' },
      { color: 'bg-yellow-500', text: 'Fair', textColor: 'text-yellow-400' },
      { color: 'bg-blue-500', text: 'Good', textColor: 'text-blue-400' },
      { color: 'bg-green-500', text: 'Strong', textColor: 'text-green-400' }
    ]
    
    return strengthLevels[passwordStrength] || strengthLevels[0]
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.08
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      {/* Back button */}
      <motion.div 
        className='absolute top-6 left-6'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
       <NavLink
                 to="/"
                 className='flex items-center gap-2 text-white/80 hover:text-cyan-300 transition-all duration-300 group'
               >
                 <MoveLeft className='h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300' />
                 Back to Home
               </NavLink>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div 
        className='sm:mx-auto sm:w-full sm:max-w-md mb-8'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className='flex justify-center space-x-4'>
          {[1, 2].map((step) => (
            <div
              key={step}
              className={`flex items-center ${step < 2 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep >= step
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-400 text-white'
                    : 'border-white/30 text-white/50'
                }`}
              >
                {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
              </div>
              {step < 2 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                    currentStep > step ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-white/20'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className='flex justify-between text-sm text-white/60 mt-2 px-2'>
          <span>Account Details</span>
          <span>Preferences</span>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div 
        className='sm:mx-auto sm:w-full sm:max-w-md'
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className='text-center'>
          <motion.h1 
            className='text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text'
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            BidWaza
          </motion.h1>
          <motion.h2 
            className='text-2xl font-bold text-white/90'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Join the Marketplace
          </motion.h2>
          <motion.p 
            className='text-white/60 mt-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {currentStep === 1 ? 'Create your account to start' : 'Tell us what interests you'}
          </motion.p>
        </div>
      </motion.div>

      {/* Form Container */}
      <motion.div 
        className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.div 
          className='backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl py-8 px-6'
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <motion.form onSubmit={handleSubmit} className='space-y-6'>
            {/* Step 1: Account Details */}
            {currentStep === 1 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Name Fields */}
                <div className='grid grid-cols-2 gap-4'>
                  <motion.div variants={itemVariants}>
                    <label htmlFor='firstName' className='block text-sm font-medium text-white/90 mb-2'>
                      First Name
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <User className='h-5 w-5 text-white/40' />
                      </div>
                      <motion.input
                        id='firstName'
                        name='firstName'
                        type='text'
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-3 pl-10 bg-white/10 border rounded-xl shadow-sm placeholder-white/40 text-white focus:outline-none transition-all duration-300 hover:bg-white/15 focus:ring-2 ${
                          errors.firstName ? 'border-red-400 focus:ring-red-400' : 'border-white/20 focus:ring-cyan-400 focus:border-transparent'
                        }`}
                        placeholder='John'
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      />
                      {errors.firstName && (
                        <motion.p 
                          className='mt-1 text-sm text-red-400'
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {errors.firstName}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label htmlFor='lastName' className='block text-sm font-medium text-white/90 mb-2'>
                      Last Name
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <User className='h-5 w-5 text-white/40' />
                      </div>
                      <motion.input
                        id='lastName'
                        name='lastName'
                        type='text'
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-3 pl-10 bg-white/10 border rounded-xl shadow-sm placeholder-white/40 text-white focus:outline-none transition-all duration-300 hover:bg-white/15 focus:ring-2 ${
                          errors.lastName ? 'border-red-400 focus:ring-red-400' : 'border-white/20 focus:ring-cyan-400 focus:border-transparent'
                        }`}
                        placeholder='Doe'
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      />
                      {errors.lastName && (
                        <motion.p 
                          className='mt-1 text-sm text-red-400'
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {errors.lastName}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Email */}
                <motion.div variants={itemVariants}>
                  <label htmlFor='email' className='block text-sm font-medium text-white/90 mb-2'>
                    Email Address
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Mail className='h-5 w-5 text-white/40' />
                    </div>
                    <motion.input
                      id='email'
                      name='email'
                      type='email'
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-3 pl-10 bg-white/10 border rounded-xl shadow-sm placeholder-white/40 text-white focus:outline-none transition-all duration-300 hover:bg-white/15 focus:ring-2 ${
                        errors.email ? 'border-red-400 focus:ring-red-400' : 'border-white/20 focus:ring-cyan-400 focus:border-transparent'
                      }`}
                      placeholder='you@example.com'
                      whileFocus={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    />
                    {errors.email && (
                      <motion.p 
                        className='mt-1 text-sm text-red-400'
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>
                </motion.div>

                {/* Password Field with Strength Indicator */}
                <motion.div variants={itemVariants}>
                  <label htmlFor='password' className='block text-sm font-medium text-white/90 mb-2'>
                    Password
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Lock className='h-5 w-5 text-white/40' />
                    </div>
                    <motion.input
                      id='password'
                      name='password'
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-3 pl-10 pr-10 bg-white/10 border rounded-xl shadow-sm placeholder-white/40 text-white focus:outline-none transition-all duration-300 hover:bg-white/15 focus:ring-2 ${
                        errors.password ? 'border-red-400 focus:ring-red-400' : 'border-white/20 focus:ring-cyan-400 focus:border-transparent'
                      }`}
                      placeholder='••••••••'
                      whileFocus={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    />
                    <button
                      type='button'
                      className='absolute inset-y-0 right-0 pr-3 flex items-center'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className='h-5 w-5 text-white/40 hover:text-white/60' />
                      ) : (
                        <Eye className='h-5 w-5 text-white/40 hover:text-white/60' />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator - FIXED */}
                  {formData.password && (
                    <motion.div 
                      className='mt-3'
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className='flex justify-between items-center mb-2'>
                        <span className='text-xs text-white/60'>Password Strength</span>
                        <span className={`text-xs font-medium ${getPasswordStrengthInfo().textColor}`}>
                          {getPasswordStrengthInfo().text}
                        </span>
                      </div>
                      <div className='w-full bg-white/20 rounded-full h-2 overflow-hidden'>
                        <motion.div 
                          className={`h-full rounded-full transition-colors duration-300 ${getPasswordStrengthInfo().color}`}
                          initial={{ width: '0%' }}
                          animate={{ width: `${Math.max((passwordStrength / 5) * 100, 0)}%` }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      </div>
                      
                    
                    </motion.div>
                  )}
                  
                  {errors.password && (
                    <motion.p 
                      className='mt-1 text-sm text-red-400'
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label htmlFor='confirmPassword' className='block text-sm font-medium text-white/90 mb-2'>
                    Confirm Password
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Lock className='h-5 w-5 text-white/40' />
                    </div>
                    <motion.input
                      id='confirmPassword'
                      name='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-3 pl-10 pr-10 bg-white/10 border rounded-xl shadow-sm placeholder-white/40 text-white focus:outline-none transition-all duration-300 hover:bg-white/15 focus:ring-2 ${
                        errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : 'border-white/20 focus:ring-cyan-400 focus:border-transparent'
                      }`}
                      placeholder='••••••••'
                      whileFocus={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    />
                    <button
                      type='button'
                      className='absolute inset-y-0 right-0 pr-3 flex items-center'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-5 w-5 text-white/40 hover:text-white/60' />
                      ) : (
                        <Eye className='h-5 w-5 text-white/40 hover:text-white/60' />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <motion.p 
                      className='mt-1 text-sm text-red-400'
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </motion.div>

                {/* Next Button */}
                <motion.button
                  type='button'
                  onClick={() => {
                    const basicValid = formData.firstName.trim() && 
                                     formData.lastName.trim() && 
                                     formData.email.trim() && 
                                     /\S+@\S+\.\S+/.test(formData.email) &&
                                     formData.password && 
                                     formData.password.length >= 8 &&
                                     formData.confirmPassword && 
                                     formData.password === formData.confirmPassword
                    if (basicValid) {
                      setCurrentStep(2)
                    } else {
                      validateForm() // Show validation errors
                    }
                  }}
                  className='w-full flex justify-center items-center py-3 px-4 
                  bg-gradient-to-r from-cyan-500 to-blue-500 
                  hover:from-cyan-600 hover:to-blue-600
                  text-white font-semibold rounded-xl shadow-lg
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-transparent
                  transition-all duration-300 transform hover:shadow-xl hover:scale-[1.02]
                  disabled:opacity-50 disabled:cursor-not-allowed'
                  variants={itemVariants}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <span>Continue</span>
                  <ArrowRight className='ml-2 h-5 w-5' />
                </motion.button>
              </motion.div>
            )}

            {/* Step 2: Interests & Preferences */}
            {currentStep === 2 && (
              <motion.div
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <motion.div variants={itemVariants}>
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">
                    What brings you to BidWaza?
                  </h3>
                  <p className="text-white/60 text-sm text-center mb-6">
                    Select what interests you most (you can change this later)
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {interestOptions.map((option) => {
                      const IconComponent = option.icon
                      const isSelected = formData.interests.includes(option.id)
                      return (
                        <motion.button
                          key={option.id}
                          type="button"
                          onClick={() => handleInterestToggle(option.id)}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                            isSelected
                              ? `bg-gradient-to-r ${option.color} border-transparent text-white shadow-lg`
                              : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/30'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <IconComponent className={`h-6 w-6 mx-auto mb-2 ${
                            isSelected ? 'text-white' : 'text-cyan-400'
                          }`} />
                          <div className="text-sm font-medium">{option.label}</div>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    type='button'
                    onClick={() => setCurrentStep(1)}
                    className='flex-1 py-3 px-4 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300'
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                  
                  <motion.button
                    type='submit'
                    className='flex-1 flex justify-center items-center py-3 px-4 
                    bg-gradient-to-r from-cyan-500 to-blue-500 
                    hover:from-cyan-600 hover:to-blue-600
                    text-white font-semibold rounded-xl shadow-lg
                    focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-transparent
                    transition-all duration-300 transform hover:shadow-xl
                    disabled:opacity-50 disabled:cursor-not-allowed'
                    disabled={loading}
                    variants={itemVariants}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleSubmit}
                  >
                    <motion.div
                      className="flex items-center"
                      animate={loading ? { x: [0, 2, -2, 0] } : {}}
                      transition={{ repeat: loading ? Infinity : 0, duration: 0.5 }}
                    >
                      {loading ? (
                        <>
                          <Loader className='mr-2 h-5 w-5 animate-spin' />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <UserPlus className='mr-2 h-5 w-5' />
                          Create Account
                        </>
                      )}
                    </motion.div>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.form>

          {/* Login Link */}
          <motion.div 
            className='mt-8 text-center'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className='text-white/60'>
              Already have an account?{" "}
              <Link to="/login"
                className='font-semibold text-cyan-300 hover:text-cyan-200 transition-colors duration-300 group'
              >
                Sign in now 
                <motion.span
                  className="inline-block ml-1"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className='inline h-4 w-4' />
                </motion.span>
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Signup
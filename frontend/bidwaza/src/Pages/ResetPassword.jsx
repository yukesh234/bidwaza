import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, Loader, MoveLeft, CheckCircle, AlertCircle } from "lucide-react"
import toast from 'react-hot-toast'
import { resetPassword } from '../services/userservices.js' // 

function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
 

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [resetSuccess, setResetSuccess] = useState(false)

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++
    return strength
  }

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value
    setFormData({ ...formData, password: newPassword })
    setPasswordStrength(calculatePasswordStrength(newPassword))
  }

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'bg-red-500'
      case 2:
        return 'bg-yellow-500'
      case 3:
        return 'bg-blue-500'
      case 4:
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'Weak'
      case 2:
        return 'Fair'
      case 3:
        return 'Good'
      case 4:
        return 'Strong'
      default:
        return ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match!")
      return
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long!")
      return
    }

    if (passwordStrength < 2) {
      toast.error("Please choose a stronger password!")
      return
    }

    setLoading(true)
    console.log("Resetting password for:", email)

   
    try {
     const response = await resetPassword(email, formData.password)
     
      
      if (response.success) {
        setResetSuccess(true)
        toast.success("Password reset successfully!")
      
       
        setTimeout(() => {
          navigate('/login')
        }, 2000)
    }
      // } else {
      //   toast.error(response.message || "Failed to reset password")
      // }
      
    } catch (error) {
      console.error("Error resetting password:", error)
      toast.error(error.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
   
  }

  // Animation variants
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
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.2
      }
    }
  }

  const successVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
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
          to="/login"
          className='flex items-center gap-2 text-white/80 hover:text-cyan-300 transition-all duration-300 group'
        >
          <MoveLeft className='h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300' />
          Back to Login
        </NavLink>
      </motion.div>

      {/* Header */}
      <motion.div 
        className='sm:mx-auto sm:w-full sm:max-w-md'
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className='text-center'>
          <motion.h1 
            className='text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text'
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Bidwaza
          </motion.h1>
          <motion.h2 
            className='text-2xl font-bold text-white/90'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Create New Password
          </motion.h2>
          <motion.p 
            className='text-white/60 mt-2 px-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {resetSuccess 
              ? "Your password has been reset successfully!" 
              : "Enter your new password below"
            }
          </motion.p>
        </div>
      </motion.div>

      {/* Form Container */}
      <motion.div 
        className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className='backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl py-8 px-6'
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          {!resetSuccess ? (
            // Reset Password Form
            <motion.form 
              onSubmit={handleSubmit} 
              className='space-y-6'
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* New Password Field */}
              <motion.div variants={itemVariants}>
                <label htmlFor='password' className='block text-sm font-medium text-white/90 mb-2'>
                  New Password
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <Lock className='h-5 w-5 text-white/40' />
                  </div>
                  <input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handlePasswordChange}
                    className='block w-full px-3 py-3 pl-10 pr-10 bg-white/10 border border-white/20 
                    rounded-xl shadow-sm placeholder-white/40 text-white
                    focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent
                    transition-all duration-300 hover:bg-white/15'
                    placeholder='Enter new password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/60'
                  >
                    {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className='mt-2'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='text-xs text-white/60'>Password Strength:</span>
                      <span className={`text-xs font-semibold ${
                        passwordStrength <= 1 ? 'text-red-400' :
                        passwordStrength === 2 ? 'text-yellow-400' :
                        passwordStrength === 3 ? 'text-blue-400' :
                        passwordStrength === 4?'text-green-400': 'text-gray-400'
                      }`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className='w-full bg-white/10 rounded-full h-1.5'>
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      />
                    </div>
                    <p className='text-xs text-white/50 mt-2'>
                      Use 8+ characters with a mix of letters, numbers & symbols
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Confirm Password Field */}
              <motion.div variants={itemVariants}>
                <label htmlFor='confirmPassword' className='block text-sm font-medium text-white/90 mb-2'>
                  Confirm Password
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <Lock className='h-5 w-5 text-white/40' />
                  </div>
                  <input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className='block w-full px-3 py-3 pl-10 pr-10 bg-white/10 border border-white/20 
                    rounded-xl shadow-sm placeholder-white/40 text-white
                    focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent
                    transition-all duration-300 hover:bg-white/15'
                    placeholder='Confirm new password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/60'
                  >
                    {showConfirmPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className='mt-2 flex items-center gap-2'>
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle className='h-4 w-4 text-green-400' />
                        <span className='text-xs text-green-400'>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className='h-4 w-4 text-red-400' />
                        <span className='text-xs text-red-400'>Passwords don't match</span>
                      </>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type='submit'
                className='w-full flex justify-center items-center py-3 px-4 
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
              >
                {loading ? (
                  <>
                    <Loader className='mr-2 h-5 w-5 animate-spin' />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock className='mr-2 h-5 w-5' />
                    Reset Password
                  </>
                )}
              </motion.button>
            </motion.form>
          ) : (
            // Success Message
            <motion.div
              className='text-center space-y-6'
              variants={successVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2 
                }}
              >
                <CheckCircle className='h-20 w-20 text-cyan-400 mx-auto' />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className='text-xl font-semibold text-white mb-2'>
                  Password Reset Successful!
                </h3>
                <p className='text-white/70 mb-4'>
                  Your password has been successfully reset.
                </p>
                <p className='text-white/60 text-sm mb-6'>
                  You can now sign in with your new password.
                </p>
                <p className='text-cyan-300 text-sm'>
                  Redirecting to login page...
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <NavLink
                  to='/login'
                  className='inline-flex items-center justify-center py-3 px-6 
                  bg-gradient-to-r from-cyan-500 to-blue-500 
                  hover:from-cyan-600 hover:to-blue-600
                  text-white font-semibold rounded-xl shadow-lg
                  transition-all duration-300 transform hover:scale-105'
                >
                  Go to Login
                </NavLink>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default ResetPassword
import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from "framer-motion"
import { Mail, Send, Loader, MoveLeft, CheckCircle } from "lucide-react"
import toast from 'react-hot-toast'
import {forgetPassword} from '../services/userservices.js'
function ForgetPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submitting email for password reset:", email);

    // try {
     
    //   if (response.ok) {
    //     // Success case
    //     setEmailSent(true);
    //     toast.success("Password reset link sent to your email!");
    //     console.log("Reset email sent successfully");
    //   } else {
    //     // Error case
    //     toast.error(data.message || "Failed to send reset link");
    //     console.log(data.message);
    //   }
    //   // ============================================
    //   // END OF API CALL SECTION
    //   // ============================================

    // } catch (error) {
    //   toast.error("An error occurred. Please try again.");
    //   console.error("Error:", error);
    // } finally {
    //   setLoading(false);
    // }

    try {
        const response = await forgetPassword(email);
        setLoading(false);
      
        if(response.success)
        {
            setEmailSent(true);
            toast.success(response.message);
            navigate('/verify-password-reset',{state:{email}});
            console.log("Reset email sent successfully");
        }
    } catch (error) {
        console.log("Error in forget password request:", error);
        setLoading(false);
        toast.error(error.message || "An error occurred. Please try again.");
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
            Reset Your Password
          </motion.h2>
          <motion.p 
            className='text-white/60 mt-2 px-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {emailSent 
              ? "Check your email for the reset link" 
              : "Enter your email and we'll send you a reset link"
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
          {!emailSent ? (
            // Email Form
            <motion.form 
              onSubmit={handleSubmit} 
              className='space-y-6'
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Email Field */}
              <motion.div variants={itemVariants}>
                <label htmlFor='email' className='block text-sm font-medium text-white/90 mb-2'>
                  Email address
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <Mail className='h-5 w-5 text-white/40' />
                  </div>
                  <motion.input
                    id='email'
                    type='email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='block w-full px-3 py-3 pl-10 bg-white/10 border border-white/20 
                    rounded-xl shadow-sm placeholder-white/40 text-white
                    focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent
                    transition-all duration-300 hover:bg-white/15'
                    placeholder='you@example.com'
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
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
                <motion.div
                  className="flex items-center"
                  animate={loading ? { x: [0, 2, -2, 0] } : {}}
                  transition={{ repeat: loading ? Infinity : 0, duration: 0.5 }}
                >
                  {loading ? (
                    <>
                      <Loader className='mr-2 h-5 w-5 animate-spin' />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className='mr-2 h-5 w-5' />
                      Send Reset Link
                    </>
                  )}
                </motion.div>
              </motion.button>

              {/* Additional Info */}
              <motion.div 
                className='text-center text-sm text-white/60'
                variants={itemVariants}
              >
                <p>Remember your password?{" "}
                  <NavLink 
                    to='/login' 
                    className='font-semibold text-cyan-300 hover:text-cyan-200 transition-colors duration-300'
                  >
                    login
                  </NavLink>
                </p>
              </motion.div>
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
                  Email Sent Successfully!
                </h3>
                <p className='text-white/70 mb-4'>
                  We've sent a password reset link to
                </p>
                <p className='text-cyan-300 font-medium mb-6'>
                  {email}
                </p>
                <p className='text-white/60 text-sm'>
                  Please check your inbox and follow the instructions to reset your password.
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
                  Back to Login
                </NavLink>
              </motion.div>

              <motion.button
                onClick={() => setEmailSent(false)}
                className='text-sm text-white/60 hover:text-cyan-300 transition-colors duration-300'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Didn't receive the email? Try again
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    
    </div>
  )
}

export default ForgetPassword
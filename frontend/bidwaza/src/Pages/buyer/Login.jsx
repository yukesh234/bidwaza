import React, { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion } from "framer-motion"
import { LogIn, Mail, Lock, ArrowRight, Loader, MoveLeft } from "lucide-react"
import { useAuth } from '../../Context/Authcontext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const Navigate = useNavigate();
  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res=await login(email,password);
    if(res.success){
      console.log("Login successful");
          toast.success("Login Successful");  
         Navigate('/');
        }
        else 
        {
          toast.error(res.message);
          console.log(res.message);
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

      {/* Header */}
      <motion.div 
        className='sm:mx-auto sm:w-full sm:max-w-md'
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className='text-center'>
          <motion.h1 
            className='text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text '
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
            Welcome Back
          </motion.h2>
          <motion.p 
            className='text-white/60 mt-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Sign in to your account
          </motion.p>
        </div>
      </motion.div>

      {/* Login Form */}
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

            {/* Password Field */}
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
                  type='password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='block w-full px-3 py-3 pl-10 bg-white/10 border border-white/20 
                  rounded-xl shadow-sm placeholder-white/40 text-white
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent
                  transition-all duration-300 hover:bg-white/15'
                  placeholder='••••••••'
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>

            {/* Forgot Password Link */}
            <motion.div 
              className='flex items-center justify-between'
              variants={itemVariants}
            >
              <div className='flex items-center'>
                <input
                  id='remember-me'
                  name='remember-me'
                  type='checkbox'
                  className='h-4 w-4 text-cyan-400 focus:ring-cyan-400 border-white/20 bg-white/10 rounded'
                />
                <label htmlFor='remember-me' className='ml-2 block text-sm text-white/70'>
                  Remember me
                </label>
              </div>
              <div className='text-sm'>
                <Link to='#' className='font-medium text-cyan-300 hover:text-cyan-200 transition-colors duration-300'>
                  Forgot password?
                </Link>
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className='mr-2 h-5 w-5' />
                    Sign In
                  </>
                )}
              </motion.div>
            </motion.button>
          </motion.form>

          {/* Signup Link */}
          <motion.div 
            className='mt-8 text-center'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className='text-white/60'>
              Don't have an account?{" "}
              <Link 
                to='/signup' 
                className='font-semibold text-cyan-300 hover:text-cyan-200 transition-colors duration-300 group'
              >
                Sign up now 
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

          {/* Divider */}
          <motion.div 
            className='mt-6'
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-white/20' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-transparent text-white/60'>Or continue with</span>
              </div>
            </div>
          </motion.div>

          {/* Social Login Buttons */}
          <motion.div 
            className='mt-6 grid grid-cols-2 gap-3'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <motion.button
              type='button'
              className='w-full inline-flex justify-center py-2 px-4 border border-white/20 rounded-xl shadow-sm bg-white/5 text-sm font-medium text-white/80 hover:bg-white/10 transition-all duration-300'
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z' clipRule='evenodd' />
              </svg>
              <span className='ml-2'>GitHub</span>
            </motion.button>

            <motion.button
              type='button'
              className='w-full inline-flex justify-center py-2 px-4 border border-white/20 rounded-xl shadow-sm bg-white/5 text-sm font-medium text-white/80 hover:bg-white/10 transition-all duration-300'
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84' />
              </svg>
              <span className='ml-2'>Twitter</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Login
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Eye, EyeOff, Loader } from "lucide-react";
import toast from "react-hot-toast";
import api from "../API/api"; // TODO: Uncomment and use

export default function ChangePasswordModal({ show, onClose }) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
  };

  // Get password strength info
  const getPasswordStrengthInfo = () => {
    const strengthLevels = [
      { color: 'bg-gray-400', text: 'No Password', textColor: 'text-gray-400' },
      { color: 'bg-red-500', text: 'Very Weak', textColor: 'text-red-400' },
      { color: 'bg-orange-500', text: 'Weak', textColor: 'text-orange-400' },
      { color: 'bg-yellow-500', text: 'Fair', textColor: 'text-yellow-400' },
      { color: 'bg-blue-500', text: 'Good', textColor: 'text-blue-400' },
      { color: 'bg-green-500', text: 'Strong', textColor: 'text-green-400' }
    ];
    
    return strengthLevels[passwordStrength] || strengthLevels[0];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update password strength when new password changes
    if (name === 'newPassword') {
      const newStrength = calculatePasswordStrength(value);
      setPasswordStrength(newStrength);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!passwordData.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      // TODO: Make API call to change password
      // const response = await api.post('/user/changePassword', {
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword
      // });
      
      // if (response.data.success) {
      //   toast.success("Password changed successfully!");
      //   handleClose();
      // } else {
      //   toast.error(response.data.message || "Failed to change password");
      // }

      const response = await api.put('/update-password',{
        currentPassword: passwordData.currentPassword,
        newpassword: passwordData.newPassword
      })

      if(response.data.success){
        toast.success("Password changed successfully!");
        handleClose();
        return; 
       }
        toast.error(response.data.message || "Failed to change password");
        
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    setPasswordStrength(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="backdrop-blur-md bg-slate-800/90 border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Change Password</h2>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent pr-12 transition-all duration-300"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent pr-12 transition-all duration-300"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
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
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent pr-12 transition-all duration-300"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold mt-6 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  "Change Password"
                )}
              </motion.button>

              {/* TODO Note */}
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-400">
                  <strong>TODO:</strong> Uncomment API call in handleSubmit() to integrate with backend
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
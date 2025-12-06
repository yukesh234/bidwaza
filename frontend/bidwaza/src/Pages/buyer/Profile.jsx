import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Edit2, 
  Save, 
  X,
  Wallet,
  MoveLeft,
  Upload
} from "lucide-react";

import toast from "react-hot-toast";
import { NavLink, useNavigate } from "react-router-dom";
import ChangePasswordModal from '../../Components/ChangePasswordModal';
import { useAuth } from "../../Context/Authcontext";
import api from '../../API/api';
// Profile Picture Preview Dialog Component
const ProfilePicturePreviewDialog = ({ isOpen, onClose, previewUrl, onUpload, loading }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-3xl shadow-2xl max-w-md w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Preview Profile Picture</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Preview Image */}
              <div className="mb-6 flex justify-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-1">
                  <div className="w-full h-full rounded-full bg-slate-800 overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Info Text */}
              <p className="text-white/60 text-sm text-center mb-6">
                This will be your new profile picture
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={onUpload}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function UserProfile() {
  const { user: authUser, balance, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [user, setUser] = useState({
    name: authUser?.FIRST_NAME && authUser?.LAST_NAME 
      ? `${authUser.FIRST_NAME} ${authUser.LAST_NAME}` 
      : "",
    email: authUser?.EMAIL || "",
    phone: authUser?.phone || "+977 9876543210",
    address: authUser?.address || "Kathmandu, Nepal",
    profilePicture: authUser?.PROFILE_PICTURE_URL || null,
    balance: balance || 25000
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editedData, setEditedData] = useState({ ...user });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  console.log("selectedFile",selectedFile);

  useEffect(() => {
    if (authUser) {
      const updatedUser = {
        name: authUser.FIRST_NAME && authUser.LAST_NAME 
          ? `${authUser.FIRST_NAME} ${authUser.LAST_NAME}` 
          : "",
        email: authUser.EMAIL || "",
        phone: authUser.phone || "+977 9876543210",
        address: authUser.address || "Kathmandu, Nepal",
        profilePicture: authUser.PROFILE_PICTURE_URL || null,
        balance: balance || 25000
      };
      setUser(updatedUser);
      setEditedData(updatedUser);
    }
  }, [authUser, balance]);

  if (!authUser) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 text-white flex items-center justify-center'>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
      setSelectedFile(file);
      setShowPreviewDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedFile) return;

    setLoading(true);

    try {
      // TODO: Make API call to upload profile picture
      const formData = new FormData();
      formData.append('file', selectedFile);  

      const response = await api.put('/user/editprofile',
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      )
      // }

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to upload profile picture");
      }
      
      setUser(prev => ({ ...prev, profilePicture: previewUrl }));
      setEditedData(prev => ({ ...prev, profilePicture: previewUrl }));
      
      toast.success("Profile picture updated!");
      setShowPreviewDialog(false);
      setPreviewUrl(null);
      setSelectedFile(null);
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile picture");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreviewDialog(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleaddfunds = () => {
    navigate('/wallet');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...user });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...user });
  };

  const handleSave = async () => {
    if (!editedData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);

    try {
      const response = await api.put('/user/updateName',{
        firstName: editedData.name.split(' ')[0],
        lastName: editedData.name.split(' ').slice(1).join(' ')
      });
      if(!response.data.success){
        throw new Error(response.data.message || "Failed to update profile");
      }

      setUser({ ...editedData });
      setIsEditing(false);
     
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

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
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 text-white pt-24 pb-12 px-6'>
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

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">My Profile</h1>
          <p className="text-white/60">Manage your account settings</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 mb-8"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-1">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-white/40" />
                    )}
                  </div>
                </div>
                
                <button
                  onClick={handleProfilePictureClick}
                  disabled={loading}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <h2 className="text-2xl font-bold mt-4">{user.name}</h2>
              <p className="text-white/60">{user.email}</p>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Available Balance</p>
                    <p className="text-2xl font-bold">रु {user.balance.toLocaleString()}</p>
                  </div>
                </div>
                <button 
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:from-cyan-600 hover:to-blue-600 font-semibold transition-all duration-300 transform hover:scale-105"
                  onClick={handleaddfunds}
                >
                  Add Funds
                </button>
              </div>
            </div>

            <div className="flex justify-end mb-6">
              {!isEditing ? (
                <motion.button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit2 className="w-5 h-5" />
                  Edit Profile
                </motion.button>
              ) : (
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: loading ? 1 : 1.05 }}
                    whileTap={{ scale: loading ? 1 : 0.95 }}
                  >
                    <Save className="w-5 h-5" />
                    {loading ? "Saving..." : "Save Changes"}
                  </motion.button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <motion.input
                      type="text"
                      name="name"
                      value={editedData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                      whileFocus={{ scale: 1.01 }}
                    />
                  ) : (
                    <p className="text-white text-lg">{user.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <p className="text-white text-lg">{user.email}</p>
                  <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6">Security Settings</h3>
            
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Password</h4>
                  <p className="text-sm text-white/60">Keep your account secure</p>
                </div>
              </div>
              <motion.button
                onClick={() => setShowPasswordModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Change Password
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <ChangePasswordModal 
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <ProfilePicturePreviewDialog
        isOpen={showPreviewDialog}
        onClose={handleCancelPreview}
        previewUrl={previewUrl}
        onUpload={handleUploadProfilePicture}
        loading={loading}
      />
    </div>
  );
}
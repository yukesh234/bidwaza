import { useState } from 'react'
import './App.css'
import { Route, Routes, Navigate } from 'react-router-dom'
import Layout from './Layouts/Layout'
import Home from './Pages/buyer/Home'
import Login from './Pages/buyer/Login'
import Signup from './Pages/buyer/Signup'
import Verification from './Pages/buyer/Verification'
import UserLayout from './Layouts/UserLayout'
import Uploadpfp from './Pages/buyer/Uploadpfp'
import SellerDashboard from './Pages/seller/SellerDashboard'
import Cart from "./Pages/buyer/Cart"
import BuyProduct from './Pages/buyer/BuyProduct'
import Productinfo from './Pages/buyer/Productinfo'
import PaymentSuccess from './Pages/PaymentSuccess.jsx'
import PaymentFailure from './Pages/PaymentFailure.jsx'
import Orders from './Pages/buyer/Orders.jsx'
import WalletPage from './Pages/buyer/Wallet.jsx'
import WalletSuccess from './Pages/buyer/WalletSuccess.jsx'
import { WalletFailure } from './Pages/buyer/WalletFailure.jsx'
import Profile from './Pages/buyer/Profile.jsx'
import ForgetPassword from './Pages/ForgetPassword.jsx'
import VerifyPasswordReset from './Pages/VerifyPasswordReset.jsx'
import ResetPassword from './Pages/ResetPassword.jsx'
import MyBidsPage from './Pages/buyer/Mybidspage.jsx'
function App() {
  return (
    <>
      <Routes>
        {/* Buyer Routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* User Auth Routes */}
        <Route element={<UserLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/uploadpfp" element={<Uploadpfp />} />
          <Route path='/forget-password' element={<ForgetPassword />} />
          <Route path='/verify-password-reset' element={<VerifyPasswordReset />} />
          <Route path='/reset-password' element={<ResetPassword />} />
        </Route>

        {/* Buyer Routes - No authentication check */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/wallet/success" element={<WalletSuccess />} />
        <Route path="/wallet/failure" element={<WalletFailure />} />
        <Route path='/mywins' element={<MyBidsPage/>}/>

        {/* Public Product Routes */}
        <Route path="/product/:productId" element={<BuyProduct />} />
        <Route path="/productinfo/:itemId" element={<Productinfo />} />
        <Route path="/esewa/success" element={<PaymentSuccess />} />
        <Route path="/esewa/failure" element={<PaymentFailure />} />

        {/* Seller Dashboard Routes - No protection, handles auth internally */}
        <Route path="/seller/*" element={<SellerDashboard />} />
      </Routes>
    </>
  )
}

export default App
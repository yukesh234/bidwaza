import { useState } from 'react'

import './App.css'
import Navbar from './Components/Header/Navbar'
import {Route, Routes} from 'react-router-dom'
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
function App() {
  return (
    <>
      <Routes>
        {/* Buyer Routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
           <Route path="/wallet" element ={<WalletPage/>} />

        </Route>

        {/* User Auth Routes */}
        <Route element={<UserLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/uploadpfp" element={<Uploadpfp />} />
         
        </Route>

        {/* Buyer Product Routes */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/product/:productId" element={<BuyProduct />} />
        <Route path="/esewa/success" element={<PaymentSuccess />} />
        <Route path="/esewa/failure" element={<PaymentFailure />} />
          <Route path="/productinfo/:itemId" element={<Productinfo />} />
          <Route path="/orders" element={<Orders />} />
        {/* Seller Dashboard Routes - Nested routing */}
        <Route path="/seller/*" element={<SellerDashboard />} />
      </Routes>
    </>
  )
}

export default App

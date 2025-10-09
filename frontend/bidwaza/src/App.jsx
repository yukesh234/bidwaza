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
        </Route>

        {/* Buyer Product Routes */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/product/:productId" element={<BuyProduct />} />

        {/* Seller Dashboard Routes - Nested routing */}
        <Route path="/seller/*" element={<SellerDashboard />} />
      </Routes>
    </>
  )
}

export default App

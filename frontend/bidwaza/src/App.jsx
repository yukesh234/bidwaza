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
       <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
      </Route>

      <Route element={<UserLayout/>}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/uploadpfp" element={<Uploadpfp/>} />
      </Route>
     
      <Route path="/seller-dashboard" element={<SellerDashboard/>} />
      <Route path="/cart" element={<Cart/>} />
       <Route path="/product/:productId" element={<BuyProduct/>} />
      </Routes>
    </>
  )
}

export default App

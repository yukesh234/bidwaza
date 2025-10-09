import React, { useEffect, useState } from 'react'
import { getCart, removefromCart, updateCartItemQuantity } from "../../services/userservices.js"
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, MoveLeft } from 'lucide-react'
import {NavLink, useNavigate} from 'react-router-dom'

function Cart() {
  const [cartItems, setCartItems] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate=useNavigate()
  
  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await getCart()
      
      if (response.success) {
        console.log("Cart data:", response)
        // Check if items exists and is not empty
       const itemsArray = Array.isArray(response.items) ? response.items : []
        setCartItems(itemsArray)
        setSummary(response.summary || {})

       

        
        if (itemsArray.length > 0) {
          toast.success("Cart loaded successfully")
        }
      } else {
        toast.error("Failed to load cart")
      }
    } catch (error) {
      console.error("Cart error:", error)
      toast.error("Error loading cart")
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartItemId, newQuantity) => {
    
    //calling api 
    try {
      const response = await updateCartItemQuantity(cartItemId, newQuantity);
      console.log(response);
      if(response.success)
      {
        //update the cart item quantity in the state
        setCartItems(prevItems => {
          const updatedItems = prevItems.map(item => {
            if (item.cartItemId === cartItemId) {
              const updatedItem = { ...item, quantity: newQuantity };
              updatedItem.subtotal = item.price * newQuantity;
              return updatedItem;
            }
            return item;
          });
          
          // Recalculate summary
          const totalAmount = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          setSummary({
            totalAmount,
            totalItems,
            itemCount: updatedItems.length
          });
          
          return updatedItems;
        });
        toast.success("Cart item quantity updated successfully");
      }
      else
      {
        toast.error("Error updating cart item quantity");
      }
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      toast.error("Error updating cart item quantity");
    }
    console.log("Update quantity:", cartItemId, newQuantity)
  }

  const removeItem = async (cartItemId) => {
    // calling the api 

    try {
      const respone = await removefromCart(cartItemId);
      if(respone.success)
      {
        //removing from the state
        setCartItems(prevItems => {
          const updatedItems = prevItems.filter(item => item.cartItemId !== cartItemId);
          
          // Recalculate summary
          const totalAmount = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          setSummary({
            totalAmount,
            totalItems,
            itemCount: updatedItems.length
          });
          
          return updatedItems;
        });
        toast.success("Item removed from cart successfully");
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
      toast.error("Error removing item from cart");
    }

    console.log("Remove item:", cartItemId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading cart...</div>
      </div>
    )
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-teal-800 to-slate-900 py-8">
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
      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingCart className="w-10 h-10" />
            Shopping Cart
          </h1>
          <p className="text-white/60">
            {summary.itemCount || 0} {summary.itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center"
          >
            <Package className="w-20 h-20 text-white/40 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-white/60 mb-6">Add some items to get started!</p>
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl cursor-pointer hover:from-cyan-600 hover:to-blue-600 transition-all"
             onClick={()=> navigate('/')}
            >
              Continue Shopping
            </button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <motion.div
                  key={item.cartItemId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.primaryImage}
                        alt={item.title}
                        className="w-32 h-32 rounded-xl object-cover"
                      />
                      <span className="inline-block mt-2 px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">
                        {item.category}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                          <p className="text-white/60 text-sm mb-2">{item.description}</p>
                          <p className="text-white/80 text-sm">
                            Sold by: <span className="text-cyan-300 font-semibold">{item?.seller?.name}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.cartItemId)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                        >
                          <Trash2 className="w-5 h-5 text-white/60 group-hover:text-red-400" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4 text-white" />
                          </button>
                          <span className="text-white font-semibold w-12 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                          <span className="text-white/60 text-sm ml-2">
                            ({item.stock} in stock)
                          </span>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-white/60 text-sm">₹{item.price} each</p>
                          <p className="text-2xl font-bold text-white">₹{item.subtotal.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 sticky top-24"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-white/80">
                    <span>Subtotal ({summary.totalItems} items)</span>
                    <span>₹{summary.totalAmount?.toLocaleString()}</span>
                  </div>
                 
                  
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-white">Total</span>
                      <span className="text-2xl font-bold text-white">
                        ₹{(summary.totalAmount ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mb-4">
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                onClick={()=> navigate('/')}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all">
                  Continue Shopping
                </button>

               
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
import api from "../API/api.js";

export const uploadProfile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);      
    // Convert userId to number before sending
   

    const response = await api.post("/user/uploadprofile", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    if (response.data.success) {
      return { success: true, response };
    }
    return { success: false, response };

  } catch (error) {
    console.error("Error uploading profile picture:", error.response?.data || error.message);
    return { success: false, error };
  }
};

export const addtocart = async(product_id) =>
{
  try {
    const response = await api.post("/cart/add-to-cart",{
      itemId: product_id
    })
    if(response.data.success)  return { success: true, message: response.data.message || "added in the cart successfully" };
    else return {success:false, message: response.data.message || "error adding in the cart"}
  } catch (error) {
     console.error("adding in the cart failed:", err);
      return { success: false, message: err.response?.data?.message || "adding in the cart failed" };
  }
}


export const getCart = async () => {
  try {
    const response = await api.get("/cart/getcart"); // your cart endpoint
    
    if (response.data.success) {
      // Return structured cart data
      return {
        success:true,
        items: response.data.data.items || [],
        summary: response.data.data.summary || {},
      };
     
    } else {
      console.error("Failed to fetch cart:", response.data.message);
      return { items: [], summary: {} };
    }
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    return { items: [], summary: {} };
  }
};


export const removefromCart = async(cartItemId) =>{
  try {
    const response = await api.delete(`cart/removecartitems/${cartItemId}`);
    if(response.data.success) return {success:true, message: response.data.message || "Item removed from cart successfully"};
    else return {success:false, message: response.data.message || "Error removing item from cart"};
  } catch (error) {
    return {success:false, message: error.response?.data?.message || "Error removing item from cart"}
  }
}

export const updateCartItemQuantity = async(cartItemId, newQuantity) =>{
  try {
    const response = await api.patch(`cart/update-quantity/${cartItemId}`, { quantity: newQuantity });
    console.log("Update response:", response.data);
    if(response.data.success) return {success:true, message: response.data.message || "Cart item quantity updated successfully"};
    else return {success:false, message: response.data.message || "Error updating cart item quantity"};
  } catch (error) {
    return {success:false, message: error.response?.data?.message || "Error updating cart item quantity"}
  }
}

export const getProductById = async (itemId) => {
  try {
    console.log('getproductby id function called with itemId:', itemId);
    const response = await api.get(`/user/getProductsByid/${itemId}`);
    console.log('Response from getProductById:', response.data);

    if (response.data.success) {
      return { success: true, data: response.data.data || {} };
    }

    return { success: false, message: "Product not found" };

  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching product details",
    };
  }
};


// NEW: Initiate payment for Buy Now (single product)
export const initiateBuyNowPayment = async (productId, quantity,amount) => {
  try {
    const response = await api.post('/esewa/pay', {
     // Backend will calculate
      productId,
      quantity,
      amount
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Buy now payment error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Payment initiation failed' 
    };
  }
};

// NEW: Initiate payment for Cart (multiple products)
export const initiateCartPayment = async (cartItems, totalAmount) => {
  try {
    const response = await api.post('/esewa/pay', {
      amount: totalAmount,
      cartItems: cartItems.map(item => ({
        productId: item.itemId || item.productId,
        quantity: item.quantity
      }))
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Cart payment error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Payment initiation failed' 
    };
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    console.log("=== VERIFICATION API CALL ===");
    console.log("Payment data being sent:", paymentData);
    console.log("API endpoint:", '/esewa/verify');
    
    const response = await api.post('/esewa/verify', paymentData);
    
    console.log("Verification response received:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Payment verification error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Payment verification failed' 
    };
  }
};


export const getOrderhistory = async () => {
  try {
    const response = await api.get('/user/getOrderHistory');
    if (response.data.success) {
      // Return the full data object which contains orders array
      // console.log("order history response data:", response.data);
      return { 
        success: true, 
        data: response.data.data // This contains { orders: [...], totalOrders: 7 }
      };
    }
    return { success: false, message: 'Failed to fetch orders' };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || "Error fetching order history" 
    };
  }
};

export const submitReview_Rating = async (orderItemId,productId,rating,reviewText)=>{
  try {
    const response = await api.post('/user/addReviewsAndRatings',
      {
        orderItemId,
        productId,
        rating,
        reviewText
      }
    );
    if(response.data.success)
    {
      return {success:true, message: response.data.message || "Review and rating submitted successfully"}
    }
    else{
      return {success:false, message: response.data.message || "Error submitting review and rating"}
    }
  } catch (error) {
    console.log|("submiiting error",error);
    return {success:false, message: error.response?.data?.message || "Error submitting review and rating"}
  }

}

export const forgetPassword = async(email)=>
{
  try {
    const response = await api.post('/forgetpassword',{
      email
    })
    if(response.data.success){
      return {
        success:true,
        message: response.data.message || "Password reset link sent to your email"
      }
    }
  } catch (error) {
    console.log("error in forget password service", error);
    return {
      success:false,
      message: error.response?.data?.message || "Error in forget password request"
    }
  }
}

export const verifyResetCode = async(email, code)=>
{
  try {
    const response = await api.post('/verify-password-reset-code',{
      email,
      code
    })
    if(response.data.success){
      return {
        success:true,
        message: response.data.message || "Verification code is valid"
      }
    } 
 } catch (error) {
    console.log("error in verify reset code service", error);
    return {
      success:false,
      message: error.response?.data?.message || "Error in verifying reset code"
    }
  }
}

export const resendCode = async(email)=> {
  try {
    const response = await api.post('/verify-password-reset-code',{
      email
    });
    if(response.data.success){
      return {
          success:true,
          message: response.data.message || "Verification code resent to your email"
      }
        }
  } catch (error) {
   console.log("error in resend code service", error);
   return {
    success:false,
    message: error.response?.data?.message || "Error in resending code"
   } 
  }
}

export const resetPassword = async (email,newpassword)=>{
  try {
    const response = await api.put('/reset-password',{
      email,
      newpassword
    })
    if(response.data.success)
    {
      return {
        success:true,
        message: response.data.message || "Password reset successfully"
      }
    }
  } catch (error) {
   console.log("error in reset password service", error);
    return {  
      success:false,
      message: error.response?.data?.message || "Error in resetting password"
    } 
  }
}
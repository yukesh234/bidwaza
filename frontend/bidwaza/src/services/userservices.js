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
      console.log("Cart fetched successfully:", response.data);
      return {
        success:true,
        items: response.data.data.items[0] || [],
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
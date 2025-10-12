import api from "../API/api";

export const addProduct= async(formData, images) =>{
    try {
         // Create FormData
          const data = new FormData()
          data.append('title', formData.title)
          data.append('description', formData.description)
          data.append('category', formData.category)
          data.append('stock', formData.stock)
          data.append('product_type', formData.product_type)
          data.append('amount', formData.amount)
          
          if (formData.product_type === 'AUCTION' || formData.product_type === 'REGISTRATION') {
            data.append('starting_price', formData.starting_price)
            data.append('start_time', formData.start_time)
            data.append('end_time', formData.end_time)
            
            if (formData.product_type === 'REGISTRATION') {
              data.append('registration_end', formData.registration_end)
            }
          }
    
          // Append images
          images.forEach(image => {
            data.append('files', image)
          })
          // submiting to the api
          const response = await api.post('/seller/addProduct',data ,{
              headers: { "Content-Type": "multipart/form-data" }
          })
          if(response.data.success)
          {
            return {success:true, message:response.data.message}
          }
          else{
            return {success:false, message:response.data.message}
          }
    } catch (error) {
        console.log(error.message);
        return {success:false, message:error.message}
    }
     
}




export const getListing = async (page = 1, limit = 5, search = "", status = "all") => {
  try {
    const response = await api.get(`/seller/getproducts`, {
      params: { page, limit, search, status },
      withCredentials: true,
    });

    const { products, pagination } = response.data.data;

    return {
      success: true,
      products,
      pagination,
    };
  } catch (error) {
    console.error("Error fetching listings:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch listings",
    };
  }
};


export const getSellerOrders = async () => {
  try {
    const response = await api.get("/seller/getsellerOrders");
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data, // Contains { orders: [...], totalOrders: 1, totalRevenue: 2699 }
        message: response.data.message
      };
    } else {
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

// NEW: Add this function for updating order status
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const response = await api.put('/seller/updateOrderStatus', {
      orderId,
      orderStatus: newStatus
    });
    
    if (response.data.success) {
      return { success: true, message: response.data.message };
    }
    return { success: false, message: response.data.message || 'Failed to update order status' };
  } catch (error) {
    console.error('Update order status error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error updating order status' 
    };
  }
};


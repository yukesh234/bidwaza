import api from "../API/api";

export const addProduct= async(formData, images) =>{
  console.table([formData, images]);
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
            console.log("Seller servicce add products", response.data.message)
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
    // console.log("getlisting products:",products)
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

export const updateStock = async (newstock, item_id) =>{
  try {
    const response = await api.put('/seller/updatestock',{
      newstock,
      item_id
    });
    if(response.data.success)
    {
      return {success: true, message: response.data.message}
    }
    else{
      return {success:false, message: response.data.message}
    }
  } catch (error) {
     return {success:false, message: error.response.data.message}
  }
}

export const  updatestatus = async(newStatus, itemId) =>{
  try {
    const response = await api.put("/seller/updatestatus",
      {
       newStatus,
       listingId:itemId
      }
    )
    if(response.data.success)
    {
      return {success:true, message:response.data.message}
    }
    else{
      return{ success:false, message:response.data.message}
    }
  } catch (error) {
    console.log("error in update status", error)
    return { success:false, message: error.message}
  }
}

export const getSellerStats = async () =>
{
  try {
    const response = await api.get("/seller/getSellerstats");
    if(response.data.success)
    {
      console.log(response.data);
      return {
        success:true,
        message: response.data.message,
        data: response.data.data
      }
    }
    else{
      return { success:false, message: response.data.message}
    }
  } catch (error) {
    console.log(error);
    return { success:false, message:error.message}
  }
}

export const getBidHistory = async(itemId) =>{
  try {
    const response = await api.get(`auction/auction/${itemId}`);
    if(response.data.success)
    {
      return {
        success:true,
        message:"history fetched successfully",
        bidHistory: response.data.data.bidHistory
      }
    }
    else{
      return{
        success:false,
        message:"error occured"
      }
    }
  } catch (error) {
    console.log("error in getting bid history",error.message);
    return {
      success:false,
      message:error.message
    }
  }
}


export const get7dayssales = async () => {
  try {
    const response = await api.get("/analytics/last7days");
    console.log("API Response:", response.data.data);
    
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message,
        // Return the complete data object with all properties
        data: response.data.data  // This includes dailySales, totalSales, and growth
      }
    } else {
      return {
        success: false,
        message: response.data.message
      }
    }
  } catch (error) {
    console.log("Error fetching last 7 days", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch sales data"
    }
  }
}

export const getMonthlySales = async(timeRange = '6months') => {
  try {
    const response = await api.get('/analytics/monthly-sales',{
      params:{timeRange}
    });
    if(response.data.success)
    {
      return response.data;
    }
    else{
      console.log("Error in fetching monthly sales:", response.data.message);
      return { success:false, message: response.data.message}
    }
  } catch (error) {
    console.log("Error in getMonthlySales:", error.message);
    return { success:false, message: error.message}
  }
}

export const getProductPerformance = async (timeRange = '6months') =>{
  try {
    const response = await api.get('/analytics/product-performance',{
      params:{timeRange}
    });
    if(response.data.success)
    {
      return response.data;
    }
    else{
      console.log("Error in fetching product performance:", response.data.message);
      return { success:false, message: response.data.message}
    }
  } catch (error) {
    console.log("Error in getProductPerformance:", error.message);
    return { success:false, message: error.message}
  }
}

export const getCatagoryRevenue = async (timeRange = '6months') =>{
  try {
    const response = await api.get('/analytics/category-revenue',{
      params:{timeRange}
    });
    if(response.data.success)
    {
      return response.data;
    }
    else{
      console.log("Error in fetching category revenue:", response.data.message);
      return { success:false, message: response.data.message}
    }
  } catch (error) {
    console.log("Error in getCategoryRevenue:", error.message);
    return { success:false, message: error.message}
  }
}

export const getTopProducts = async (timeRange = '6months') =>{
  try {
    const response = await api.get('/analytics/top-products',{
      params:{timeRange}
    });
    if(response.data.success)
      {
      return response.data;
      }
      else{
      console.log("Error in fetching top products:", response.data.message);
      return { success:false, message: response.data.message}
      }
    
  } catch (error) {
    console.log("Error in getTopProducts:", error.message);
    return { success:false, message: error.message}
  }
}

export const getAuctionStats = async (timeRange = '6months') =>{
  try {
    const response = await api.get('/analytics/auction-stats',{
      params:{timeRange}
    });
    if(response.data.success)
    {
      return response.data;
    }
    else{
      console.log("Error in fetching auction stats:", response.data.message);
      return { success:false, message: response.data.message}
    }
  } catch (error) {
    console.log("Error in getAuctionStats:", error.message);
    return { success:false, message: error.message}
  }
}

export const updateProduct = async (productId, formData, newImages = [], existingImages = [], deletedImageUrls = []) => {
  console.log("Update product service data:", {
    productId,
    formData,
    newImagesCount: newImages.length,
    existingImagesCount: existingImages.length,
    deletedImageUrls
  });

  try {
    const formDataObj = new FormData();

    // Append form data as JSON string
    formDataObj.append('formData', JSON.stringify(formData));
    
    // Append deleted image URLs as JSON string
    formDataObj.append('deletedImageUrls', JSON.stringify(deletedImageUrls));

    // Append new image files - Must match multer field name: 'files'
    if (newImages && newImages.length > 0) {
      newImages.forEach((file) => {
        formDataObj.append('files', file); // Matches upload.array("files", 5)
      });
      console.log(`Appending ${newImages.length} new images to FormData`);
    }

    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (let pair of formDataObj.entries()) {
      if (pair[1] instanceof File) {
        console.log(pair[0], ':', pair[1].name, pair[1].type, pair[1].size);
      } else {
        console.log(pair[0], ':', pair[1]);
      }
    }

    const response = await api.patch(`/seller/updateProduct/${productId}`, formDataObj, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'Product updated successfully',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to update product'
      };
    }

  } catch (error) {
    console.error('Update product error:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to update product'
    };
  }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await api.delete(`/seller/deleteProduct/${productId}`);
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'Product deleted successfully'
      };
    }
    else{
      return { success:false, message: response.data.message || 'Failed to delete product' }
    }
  } catch (error) {
    console.log("Error in deleteProduct service:", error.message);
    return { success:false, message: error.response?.data?.message || error.message || 'Failed to delete product'}
  }
}
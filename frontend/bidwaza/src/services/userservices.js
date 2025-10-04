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
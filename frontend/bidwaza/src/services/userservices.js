import api from "../API/api.js";

export const uploadProfile = async (file, userId) => {
  try {
    const formData = new FormData();
    formData.append("file", file);      
    // Convert userId to number before sending
    formData.append("userid", parseInt(userId)); // This fixes the ORA-01722 error

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
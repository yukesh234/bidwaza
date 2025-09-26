import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload image
const uploadImage = async (filepath) => {
  try {
    if (!filepath) return null;

    const response = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
    });

    // Cleanup local file after upload
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    console.log("Uploaded:", response.secure_url);
    return response.secure_url; // return only the secure URL
  } catch (error) {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    console.error("Upload failed:", error);
    throw error;
  }
};

// Delete image
const deleteImage = async (fileUrl) => {
  try {
    const publicId = extractPublicIdFromUrl(fileUrl);
    if (!publicId) throw new Error("Could not extract public_id from URL");

    const response = await cloudinary.uploader.destroy(publicId);

    if (response.result === "ok") {
      console.log(`File deleted: ${publicId}`);
      return true;
    } else {
      throw new Error(`Failed to delete: ${response.result}`);
    }
  } catch (error) {
    console.error("Delete failed:", error);
    throw error;
  }
};

// Extract public_id from URL
const extractPublicIdFromUrl = (url) => {
  try {
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    return filename.split(".")[0]; // remove extension
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
};

export { uploadImage, deleteImage };

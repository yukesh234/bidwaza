import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})

const uploadImage = async (filepath) =>{
    try {
         if(!filepath) return;
         //uploading files to cloudinary
         const response = await cloudinary.uploader.upload(filepath,{
            resource_type: "auto"
         })
         //file uploaded 
         console.log(response.url);
         return response;
    } catch (error) {
        fs.unlinkSync(filepath)
        console.log(error);
        return;
    }
}

export default uploadImage;


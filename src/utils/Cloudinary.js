import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const deleteFromCloudinary = async (publicId, resourceType = "auto") => {
    if (!publicId) return;

    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        return result;
    } catch (error) {
        console.error("Cloudinary deletion failed:", error);
        throw new Error("Failed to delete from Cloudinary");
    }
};
const uploadOnCloudinary = async (localfilepath)=>{
    try {
        if(!localfilepath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localfilepath,{
            resource_type: "auto"
        })
        //file has been uploaded succesfully
        //console.log("File is uploaded on Cloudinary",response.url)
        fs.unlinkSync(localfilepath)
        return response;
    } catch (error) {
        if (fs.existsSync(localfilepath)) {
            fs.unlinkSync(localfilepath); // remove the locally saved temporary file
        }
        console.error("Cloudinary upload failed:", error);
        return null; // or throw error if you want

    }
}

export {uploadOnCloudinary,
    deleteFromCloudinary
}
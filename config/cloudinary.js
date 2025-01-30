import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

// configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // file has been uploaded
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file

        return response;
    } catch (error) {
        console.log("Error while uploading image: ", error);

        fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload failed

        return null;
    }
};

const deleteFromCloudinary = async (url) => {
    try {
        // Extract public ID by getting the part between /upload/ and .extension
        const publicId = url.split("/upload/")[1].split(".")[0];
        
        // This will remove the version number (v1735406731/) if present
        const finalPublicId = publicId.split("/").pop();

        const result = await cloudinary.uploader.destroy(finalPublicId);

        return result;
    } catch (error) {
        console.log("Error while deleting image:", error);
        throw new ApiError(error); // Re-throw the error for proper error handling
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };

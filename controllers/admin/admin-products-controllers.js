import mongoose from "mongoose";
import { Product } from "../../models/product.model.js";
import { User } from "../../models/user.model.js";
import { asyncHandler } from "../../config/asyncHandler.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../../config/cloudinary.js";
import { ApiError } from "../../config/ApiError.js";
import { ApiResponse } from "../../config/ApiResponse.js";

const uploadProductsImage = asyncHandler(async (req, res) => {
    const productImageLocalPath = req.file?.path;

    if (!productImageLocalPath) {
        return res
            .status(400)
            .json({ message: "Product Image is required why" });
    }

    const productImage = await uploadOnCloudinary(productImageLocalPath);

    if (!productImage.secure_url) {
        return res.status(400).json({ message: "Error while uploading" });
    }

    return res.status(200).json({
        message: "Image successfully uploaded",
        link: productImage.secure_url,
    });
});

const deleteProductImage = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        return res
            .status(404)
            .json(new ApiResponse(404, product, "Product not found"));
    }

    const deleteProductImage = deleteFromCloudinary(product.image);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deleteProductImage,
                "Image deleted successfully"
            )
        );
});

// add a new product
const addProduct = asyncHandler(async (req, res) => {
    const { title, description, category, sellingPriceInPaisa, totalStock } =
        req.body;

    const productImageLocalPath = req.file?.path;

    if (!productImageLocalPath) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Product Image is required"));
    }

    const productImage = await uploadOnCloudinary(productImageLocalPath);

    if (!productImage.secure_url) {
        return res.status(400).json({ message: "Error while uploading" });
    }

    const newProduct = await Product.create({
        title,
        description,
        category,
        sellingPriceInPaisa: sellingPriceInPaisa * 100,
        owner: req.user._id,
        totalStock,
        image: productImage.secure_url,
    });

    if (!newProduct) {
        return res
            .status(500)
            .json({ message: "Error occurred while adding product" });
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $push: {
                addedProducts: newProduct._id,
            },
        },
        {
            new: true,
        }
    );

    res.status(201).json(
        new ApiResponse(201, newProduct, "Product added successfully")
    );
});

// fetch all product that are added by a user himself (seller fetch his added products)
/* const getProductList = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "products",
                localField: "addedProducts",
                foreignField: "_id",
                as: "addedProducts",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            sellingPriceInPaisa: 1,
                            category: 1,
                            description: 1,
                            totalStock: 1,
                            avgRating: 1,
                            ratingCount: 1,
                            image: 1,
                        },
                    },
                ],
            },
        },
    ]);

    if (!user[0]) {
        return res
            .status(404)
            .json(new ApiResponse(404, user, "User not Found"));
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].addedProducts,
                "Product fetched successfully"
            )
        );
}); */

const getProductList = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [result] = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "products",
                localField: "addedProducts",
                foreignField: "_id",
                as: "addedProducts",
            },
        },
        {
            $facet: {
                metadata: [
                    {
                        $project: {
                            totalProducts: { $size: "$addedProducts" },
                        },
                    },
                ],
                products: [
                    { $unwind: "$addedProducts" },
                    { $sort: { "addedProducts.createdAt": -1 } },
                    { $skip: skip },
                    { $limit: parseInt(limit) },
                    {
                        $project: {
                            _id: "$addedProducts._id",
                            title: "$addedProducts.title",
                            sellingPriceInPaisa:
                                "$addedProducts.sellingPriceInPaisa",
                            category: "$addedProducts.category",
                            description: "$addedProducts.description",
                            totalStock: "$addedProducts.totalStock",
                            avgRating: "$addedProducts.avgRating",
                            ratingCount: "$addedProducts.ratingCount",
                            image: "$addedProducts.image",
                        },
                    },
                ],
            },
        },
    ]);

    if (!result) {
        return res
            .status(404)
            .json(new ApiResponse(404, null, "User not found"));
    }

    const totalProducts = result.metadata[0]?.totalProducts || 0;
    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products: result.products,
                metadata: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalProducts,
                    hasMore: parseInt(page) < totalPages,
                    itemsPerPage: parseInt(limit),
                },
            },
            "Products fetched successfully"
        )
    );
});

// get product details
const getProductDetailByAdmin = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const productDetail = await Product.findById(productId).select("-owner");

    res.status(200).json(
        new ApiResponse(200, productDetail, "Product fetched successfully")
    );
});

// edit a product
const editProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const {
        title,
        description,
        category,
        sellingPriceInPaisa,
        totalStock,
    } = req.body;

    const updateProductDetails = await Product.findByIdAndUpdate(
        productId,
        {
            $set: {
                title,
                description,
                category,
                sellingPriceInPaisa,
                totalStock,
            },
        },
        { new: true }
    );

    if (!updateProductDetails) {
        return res
            .status(404)
            .json(
                new ApiResponse(404, updateProductDetails, "Product not found")
            );
    }

    res.status(200).json(
        new ApiResponse(
            200,
            updateProductDetails,
            "Product details has been updated successfully"
        )
    );
});

// delete a product
const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        return res
            .status(404)
            .json(new ApiResponse(404, product, "Product not found"));
    }

    await User.findByIdAndUpdate(req.user._id, {
        $pull: {
            addedProducts: productId,
        },
    });

    const deletedImage = deleteFromCloudinary(product.image);

    const productDelete = await Product.findByIdAndDelete(productId);

    res.status(200).json(
        new ApiResponse(200, productDelete, "Product deleted successfully")
    );
});

export {
    addProduct,
    getProductList,
    editProduct,
    deleteProduct,
    uploadProductsImage,
    getProductDetailByAdmin,
};

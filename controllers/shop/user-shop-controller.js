import mongoose from "mongoose";
import { Product } from "../../models/product.model.js";
import { asyncHandler } from "../../config/asyncHandler.js";
import { ApiError } from "../../config/ApiError.js";
import { ApiResponse } from "../../config/ApiResponse.js";
import { Cart } from "../../models/cart.model.js";
import { User } from "../../models/user.model.js";
import { createRazorpayInstance } from "../../config/razorpay.config.js";

// total quantity and total price
async function calculateTotalQuantityAndPrice(cart, product) {
    cart.totalQuantity = cart.items.reduce(
        (total, item) => total + item.quantity,
        0
    );
    cart.totalPriceInPaisa = cart.items.reduce((total, item) => {
        return total + product.sellingPriceInPaisa * item.quantity;
    }, 0);

    // save changes to cart
    await cart.save();

    // Populate product details before sending response
    const populateCart = await Cart.findById(cart._id).populate({
        path: "items.product",
        select: "title description category image avg avgRating priceInPaisa",
    });

    return populateCart;
}

// fetch product details with pagination and filters
const fetchProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        category,
        minPrice,
        maxPrice,
        sortBy,
        search,
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Add filters
    // Handle multiple categories
    if (category) {
        const categories = category.split(","); // Convert "Men,Women" to ["Men", "Women"]
        query.category = { $in: categories };
    }

    if (minPrice) {
        query.sellingPriceInPaisa = { $gte: parseInt(minPrice) * 100 };
    }
    if (maxPrice) {
        query.sellingPriceInPaisa = {
            ...query.sellingPriceInPaisa,
            $lte: parseInt(maxPrice) * 100,
        };
    }

    if (search) query.title = { $regex: search, $options: "i" }; // Case-insensitive partial text search

    const sortOptions = {
        "price-asc": { sellingPriceInPaisa: 1 },
        "price-desc": { sellingPriceInPaisa: -1 },
        latest: { createdAt: -1 },
    };
    const sort = sortOptions[sortBy] || { createdAt: -1 };

    try {
        const [products, totalProducts] = await Promise.all([
            Product.find(query).sort(sort).skip(skip).limit(limit),
            Product.countDocuments(query),
        ]);

        const totalPages = Math.ceil(totalProducts / limit);

        return res.status(200).json(
            new ApiResponse(200, {
                products,
                currentPage: parseInt(page),
                totalPages,
                totalProducts,
                hasMore: page < totalPages,
            })
        );
    } catch (error) {
        throw new ApiError(500, "Error fetching products");
    }
});

// get product details
const getProductDetail = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const productDetail = await Product.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(productId),
            },
        },
        // Lookup owner details from users collection
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            email: 1,
                            fullName: 1,
                        },
                    },
                ],
            },
        },
        // Convert owner array to single object
        {
            $addFields: {
                owner: { $first: "$owner" },
            },
        },
    ]);

    if (!productDetail[0])
        return res.status(404).json(new ApiError(404, "Product Not Found!"));

    res.status(200).json(
        new ApiResponse(200, productDetail[0], "Product fetched successfully")
    );
});

// add product to cart and increase the quantity of existing items
const addToCart = asyncHandler(async (req, res) => {
    const { productID, quantity = 1 } = req.body;

    const product = await Product.findById(productID);

    // Check if product exists
    if (!product) {
        return res.status(400).json(new ApiResponse(400, "Product not found"));
    }

    // Check stock availability
    if (product.totalStock <= 0) {
        return res.status(200).json(new ApiResponse(200, "Out of stock"));
    }

    // Find user's cart
    let cart = await Cart.findOne({ owner: req?.user?._id });

    // If cart doesn't exist, create new cart (empty cart for a user)
    if (!cart) {
        cart = await Cart.create({
            items: [
                {
                    product: productID,
                    quantity: quantity,
                },
            ],
            owner: req.user._id,
            totalQuantity: quantity,
            totalPriceInPaisa: Number(product.sellingPriceInPaisa * quantity),
        });

        return res
            .status(201)
            .json(new ApiResponse(201, cart, "Product added to cart"));
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productID
    );

    if (existingItemIndex !== -1) {
        // update the existing item quantity
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        // Add new item to cart
        cart.items.push({
            product: productID,
            quantity,
        });
    }

    // update total quantity and total price
    const populateCart = await calculateTotalQuantityAndPrice(cart, product);

    return res
        .status(200)
        .json(new ApiResponse(200, populateCart, "Product added to cart"));
});

// decrease quantity of existing items from the cart
const decreaseQuantity = asyncHandler(async (req, res) => {
    const { productID, quantity = 1 } = req.body;

    const product = await Product.findById(productID);

    // Check if product exists
    if (!product) {
        return res.status(400).json(new ApiResponse(400, "Product not found"));
    }

    // Find user's cart
    let cart = await Cart.findOne({ owner: req?.user?._id });

    // If cart doesn't exist, return
    if (!cart) {
        return res
            .status(404)
            .json(new ApiResponse(404, cart, "Cart doesn't exist"));
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productID
    );

    if (existingItemIndex !== -1) {
        // update the existing item quantity
        if (cart.items[existingItemIndex].quantity >= 2) {
            cart.items[existingItemIndex].quantity -= quantity;
        } else {
            cart.items.splice(existingItemIndex, 1);
        }
    } else {
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    cart,
                    "You didn't add this product on cart"
                )
            );
    }

    // update total quantity and total price
    const populateCart = await calculateTotalQuantityAndPrice(cart, product);

    return res
        .status(200)
        .json(new ApiResponse(200, populateCart, "Product decrease from cart"));
});

// delete cart items
const removeCartItem = asyncHandler(async (req, res) => {
    const { productID } = req.body;

    const product = await Product.findById(productID);

    // Check if product exists
    if (!product) {
        return res.status(400).json(new ApiResponse(400, "Product not found"));
    }

    // Find user's cart
    let cart = await Cart.findOne({ owner: req?.user?._id });

    // If cart doesn't exist, return
    if (!cart) {
        return res
            .status(404)
            .json(new ApiResponse(404, cart, "Cart doesn't exist"));
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productID
    );

    if (existingItemIndex !== -1) {
        cart.items.splice(existingItemIndex, 1);
    } else {
        return res
            .status(400)
            .json(new ApiResponse(400, cart, "Product is not added"));
    }

    // update total quantity and total price
    const populateCart = await calculateTotalQuantityAndPrice(cart, product);

    return res
        .status(200)
        .json(
            new ApiResponse(200, populateCart, "Product removed successfully")
        );
});

// get cart products
const getCartItems = asyncHandler(async (req, res) => {
    // get - existing - checkout - information;
    const cartItems = await Cart.findOne({ owner: req.user._id })
        .populate({
            path: "items.product",
            select: "title description category image avg avgRating _id",
        })
        .select("items totalQuantity totalPriceInPaisa");

    if (!cartItems) {
        return res
            .status(200)
            .json(new ApiResponse(200, cartItems, "Your cart is empty"));
    }

    // Transform the data to a cleaner format
    const transformedCart = {
        items: cartItems.items.map((item) => ({
            product: {
                title: item.product.title,
                image: item.product.image,
                sellingPriceInPaisa: item.product.sellingPriceInPaisa,
            },
            quantity: item.quantity,
            itemTotal: item.quantity * item.product.sellingPriceInPaisa,
        })),
        totalItems: cartItems.totalQuantity,
        totalAmount: cartItems.totalPriceInPaisa,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            transformedCart,
            "Cart items is fetched successfully"
        )
    );
});


export {
    fetchProducts,
    getProductDetail,
    addToCart,
    getCartItems,
    decreaseQuantity,
    removeCartItem,
};

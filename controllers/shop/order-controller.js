import { Order } from "../../models/order.model.js";
import { ApiError } from "../../config/ApiError.js";
import { ApiResponse } from "../../config/ApiResponse.js";
import { asyncHandler } from "../../config/asyncHandler.js";
import { createRazorpayInstance } from "../../config/razorpay.config.js";
import { Cart } from "../../models/cart.model.js";
import crypto from "crypto";
import mongoose from "mongoose";

// create an order
const createOrder = asyncHandler(async (req, res) => {
    const { deliveryDetails, _id } = req.body;
    const objectId = new mongoose.Types.ObjectId(_id);

    const cart = await Cart.findById(objectId);
    if (!cart) {
        return res.status(404).json(new ApiError(404, cart, "Cart is empty"));
    }

    const userId = cart.owner;

    /* const cart = await Cart.findOne({ owner: req.user._id });

    if (!cart || !cart.items || cart.items.length === 0) {
        throw new ApiError(404, "Cart is empty");
    }

    // add additional information to the cart (name, email, phoneNo, address, city, state, zipcode)
    const userId = req.user._id;
    const { deliveryDetails } = req.body; */

    const razorpay = createRazorpayInstance();

    // create an order
    const options = {
        amount: cart.totalPriceInPaisa,
        currency: "INR",
        receipt: crypto.randomBytes(10).toString("hex"),
        payment_capture: 1,
    };

    try {
        const razorpayOrder = await razorpay.orders.create(options);

        const order = new Order({
            user: userId,
            items: cart.items,
            totalAmount: cart.totalPriceInPaisa,
            deliveryDetails,
            paymentStatus: "Pending",
            razorpayOrderId: razorpayOrder.id,
        });

        await order.save();

        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    orderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    deliveryDetails: order.deliveryDetails,
                },
                "Order created successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, "Internal server error");
    }
});

// verify payment_capture
const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

    try {
        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        const isAuthentic = expectedSign === razorpay_signature;

        if (isAuthentic) {
            const order = await Order.findOneAndUpdate(
                {
                    razorpayOrderId: razorpay_order_id,
                },
                {
                    paymentStatus: "Paid",
                },
                { new: true }
            );

            res.json(
                new ApiResponse(200, order, "Payment verified successfully")
            );
        }
    } catch (err) {
        throw new ApiError(500, "Internal server error");
    }
});

// order history with some selected information with pagination
const orderHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .select("items totalAmount deliveryDetails paymentStatus deliveryStatus createdAt")
        .populate("items.productId", "name price");

    res.json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

// track order
const trackOrder = asyncHandler(async (req, res) => {
    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    res.json(new ApiResponse(200, order, "Order fetched successfully"));
});

export { createOrder, verifyPayment, orderHistory, trackOrder };

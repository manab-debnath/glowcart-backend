const { ApiResponse } = require("../../config/ApiResponse");
const { asyncHandler } = require("../../config/asyncHandler");
const { Order } = require("../../models/order.model");



// get all orders
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find().populate("user", "name email");

    res.status(200).json(
        new ApiResponse(200, orders, "Orders fetched successfully")
    );
});
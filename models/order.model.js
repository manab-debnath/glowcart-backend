import { Schema, model } from "mongoose";

const orderSchema = new Schema(
    {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                },
                quantity: {
                    type: Number,
                    required: true,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        deliveryDetails: {
            fullName: { type: String, required: true },
            email: { type: String, required: true },
            phoneNo: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipcode: { type: String, required: true },
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },
        deliveryStatus: {
            type: String,
            enum: ["Pending", "Dispatched", "Out for delivery", "Cancelled"],
            default: "Pending",
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        razorpayOrderId: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const Order = model("Order", orderSchema);

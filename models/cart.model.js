import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema(
    {
        items: [
            {
                product: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                },
                quantity: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        totalQuantity: {
            type: Number,
            default: 0,
        },
        totalPriceInPaisa: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);

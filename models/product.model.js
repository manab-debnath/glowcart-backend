import { model, Schema } from "mongoose";

const productSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ["Men", "Women", "Kids", "Accessories", "Footwear", "Jewellery"],
            required: true,
        },
        sellingPriceInPaisa: {
            type: Number,
            required: true,
        },
        totalStock: {
            type: Number,
            required: true,
        },
        avgRating: {
            type: Number,
            default: 0,
        },
        ratingCount: {
            type: Number,
            default: 0,
        },
        image: {
            type: String,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Product = model("Product", productSchema);

import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by cors"));
        }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cache-Control",
        "Expires",
        "Pragma",
    ],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/auth/auth-routes.js";
import adminProductsRouter from "./routes/admin/admin-products-router.js";
import userProductRouter from "./routes/users/user-product-router.js";
import orderRouter from "./routes/shop/order-router.js";

// routes declaration
app.use("/api/v1/user/auth", userRouter);
app.use("/api/v1/admin/products", adminProductsRouter);

app.use("/api/v1/shop", userProductRouter);

// orders
app.use("/api/v1/shop/checkout", orderRouter);

export default app;

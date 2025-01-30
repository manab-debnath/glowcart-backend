import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth-middleware.js";
import {
    createOrder,
    verifyPayment,
} from "../../controllers/shop/order-controller.js";

const router = Router();

// create an order
router.route("/create-order").post(createOrder);
router.route("/verify-payment").post(verifyPayment);

export default router;

import { Router } from "express";
import {
    addToCart,
    decreaseQuantity,
    removeCartItem,
    fetchProducts,
    getCartItems,
    getProductDetail,
} from "../../controllers/shop/user-shop-controller.js";
import { verifyJWT } from "../../middlewares/auth-middleware.js";

const router = Router();

// fetch product detail with pagination
router.route("/products").get(fetchProducts);

// get a product detail
router.route("/product/:productId").get(getProductDetail);

// add to cart product
router.route("/add-to-cart").put(verifyJWT, addToCart);

// decrease quantity of items from cart
router.route("/decrease-quantity").put(verifyJWT, decreaseQuantity);

// delete item from cart
router.route("/delete-item").put(verifyJWT, removeCartItem);

// get cart items
router.route("/get-cart-items").get(verifyJWT, getCartItems);



export default router;

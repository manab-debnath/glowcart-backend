import { Router } from "express";
import { upload } from "../../middlewares/multer-middleware.js";
import {
    addProduct,
    editProduct,
    deleteProduct,
    uploadProductsImage,
    getProductList,
    getProductDetailByAdmin,
} from "../../controllers/admin/admin-products-controllers.js";
import { verifyJWT, verifySeller } from "../../middlewares/auth-middleware.js";

const router = Router();

// add a new product
router
    .route("/add-product")
    .post(verifyJWT, verifySeller, upload.single("image"), addProduct);

// edit product images
router
    .route("/upload-image")
    .post(verifyJWT, verifySeller, upload.single("image"), uploadProductsImage);

// fetch product list
router.route("/get-product-list").get(verifyJWT, verifySeller, getProductList);

// fetch product detail by admin
router.route("/product/:productId").get(verifyJWT, verifySeller, getProductDetailByAdmin)

// edit a product details
router
    .route("/edit-product/:productId")
    .put(verifyJWT, verifySeller, editProduct);

// delete a product from product list
router.route("/delete-product/:productId").delete(verifyJWT, verifySeller, deleteProduct);

export default router;

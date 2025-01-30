import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    becomeSeller,
} from "../../controllers/auth/auth-controller.js";
import { verifyJWT, verifySeller } from "../../middlewares/auth-middleware.js";
import { validate } from "../../middlewares/validate-middleware.js";
import {
    signupSchema,
    signinSchema,
} from "../../controllers/validator/auth-validator.js";

const router = Router();

// register user route
router.route("/register").post(validate(signupSchema), registerUser, loginUser);

// login user route
router.route("/login").post(validate(signinSchema), loginUser);

// logout user route
router.route("/logout").post(verifyJWT, logoutUser);

// become seller route
router.route("/become-seller").put(verifyJWT, becomeSeller);

// Authenticated or not route
router.get("/check-auth", verifyJWT, (req, res) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        message: "Authenticated user",
        user,
    });
});


export default router;

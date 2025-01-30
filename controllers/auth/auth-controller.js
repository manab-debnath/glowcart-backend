import { ApiError } from "../../config/ApiError.js";
import { asyncHandler } from "../../config/asyncHandler.js";
import { ApiResponse } from "../../config/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Product } from "../../models/product.model.js";

// generate access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get user detail from frontend
    // validation - not empty
    // check if user exists: username, email
    // create user object - create entry in database
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const { email, fullName, password } = req.body;

    // check if user exists
    const existedUser = await User.findOne({ email });

    if (existedUser) {
        return res.json({
            message:
                "User Already exists with the same email! Please try again",
            status: 409,
            success: false,
        });
    }

    // create user
    const user = await User.create({
        email,
        fullName,
        password,
    });

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        return res.json({
            message: "Something went wrong while registering user",
            status: 500,
        });
    }

    const option = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                201,
                { user: createdUser, accessToken, refreshToken },
                "User created successfully"
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookies

    const { email, password } = req.body;

    // check if user exists
    const user = await User.findOne({ email });

    if (!user) {
        return res
            .status(400)
            .json(new ApiResponse(400, user, "User doesn't exist"));
    }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res
            .status(401)
            .json(new ApiResponse(401, null, "Invalid user credentials"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const option = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    res.clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json({ success: true, message: "Logout successfully" });
});

const becomeSeller = asyncHandler(async (req, res) => {
    if (req?.user?.role === "seller") {
        return res.json({ msg: "You are already a seller" });
    }

    const user = await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set: {
                role: "seller",
            },
        },
        {
            new: true,
        }
    ).select("-password");

    res.status(200).json({
        msg: "Congratulation, you are now a seller",
        success: true,
    });
});

export { registerUser, loginUser, logoutUser, becomeSeller };

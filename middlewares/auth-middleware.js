import { ApiError } from "../config/ApiError.js";
import { asyncHandler } from "../config/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../config/ApiResponse.js";

const generateAccessTokenFromRefreshToken = async (refreshToken) => {
    try {
        const decodedToken = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);
        if (!user) return null;

        if (user.refreshToken !== refreshToken) {
            return null;
        }

        // Generate new access token
        const accessToken = await user.generateAccessToken();

        return accessToken;
    } catch (error) {
        return null;
    }
};

async function verifyAccessToken(accessToken) {
    try {
        const decodedToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        return user;
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new Error("Token expired");
        }
        return null;
    }
}

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        if (!accessToken && !refreshToken) {
            return res
                .status(401)
                .json(
                    new ApiResponse(
                        401,
                        null,
                        "Unauthorized request - Please login"
                    )
                );
        }

        // Case 1: No access token but has refresh token
        if (!accessToken && refreshToken) {
            // generate new access token using existing refresh token
            const newAccessToken = await generateAccessTokenFromRefreshToken(
                refreshToken
            );

            const user = await verifyAccessToken(newAccessToken);

            if (!user) {
                return res
                    .status(401)
                    .json(
                        new ApiResponse(
                            401,
                            user,
                            "Invalid access token -- Please login again"
                        )
                    );
            }

            // Set new access token in cookie
            res.cookie("accessToken", newAccessToken, {
                httpOnly: true,
                secure: true,
            });

            req.user = user;
            next();
        }

        // Case 2: Has access token
        else {
            try {
                const user = await verifyAccessToken(accessToken);

                if (!user) {
                    return res
                        .status(401)
                        .json(
                            new ApiResponse(
                                401,
                                null,
                                "Invalid access token - Please login again"
                            )
                        );
                }

                req.user = user;
                next();
            } catch (error) {
                // If access token is expired/invalid, ask user to login again
                return res
                    .status(401)
                    .json(
                        new ApiResponse(
                            401,
                            null,
                            "Session expired - Please login again"
                        )
                    );
            }
        }
    } catch (error) {
        throw new ApiError(
            401,
            "Authentication failed - Please login again",
            error
        );
    }
});

const verifySeller = asyncHandler(async (req, res, next) => {
    const user = req.user;

    if ("seller" !== user?.role) {
        return res
            .status(401)
            .json(
                new ApiResponse(
                    401,
                    { role: user.role },
                    "Unauthorized access - Please become a seller to access the site"
                )
            );
    }

    next();
});

export { verifyJWT, verifySeller };

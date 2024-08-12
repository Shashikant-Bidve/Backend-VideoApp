import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// function to be callled is controller so directly call controller which is made in controllers. 
router.route("/register").post(
    upload.fields(
        [
            {
                name: "avatar",
                maxCount: 1
            },{
                name: "coverImage",
                maxCount: 1
            }
        ]
    ),
    registerUser
);

router.route("/login").post(
    loginUser
);

router.route("/logout").post(
    verifyJWT,
    logoutUser
)

router.route("/refreshToken").post(refreshAccessToken);

export default router; 
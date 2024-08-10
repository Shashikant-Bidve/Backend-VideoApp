import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

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

export default router; 
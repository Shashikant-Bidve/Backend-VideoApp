import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async(req, res) => {
    // check if session is already there
    // get details from user
    // validation
    // check if user is alredy signedUp
    // if yes redirect to signIn
    // else continue signup

    const {fullname, email, username, password} = req.body;
    const checkEmpty = [fullname, email, username, password].some((field) => field?.trim() === ""); 
    if(checkEmpty){
        throw new ApiError(400, "All fields are required");
    }
    
    const userAlreadyExists = User.findOne({
        $or: [{email}, {username}]
    })

    if(userAlreadyExists){
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImagePath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        return new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImagePath);

    if(!avatar){
        return new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url,
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        return new ApiError(500, "Something went wrong while regitering user.")
    }
    
    return res.status(201).json(
        new ApiResponse(200, "User registered successfully")
    ) 

})

export {registerUser};
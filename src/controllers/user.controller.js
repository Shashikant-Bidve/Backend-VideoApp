import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // save refreshToken in DB
        user.refreshToken = refreshToken;
        // no need for required field changes
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler( async(req, res) => {
    // check if session is already there
    // get details from user
    // validation
    // check if user is alredy signedUp
    // if yes redirect to signIn
    // else continue signup
    // if (
    //     [fullName, email, username, password].some((field) => field?.trim() === "")
    // ) {
    //     throw new ApiError(400, "All fields are required")
    // }



    const {fullname, email, username, password} = req.body;
    const checkEmpty = [fullname, email, username, password].some((field) => {return field === undefined}) 
    if(checkEmpty){
        throw new ApiError(400, "All fields are required");
    }
    
    
    const userAlreadyExists = await User.findOne({
        $or: [{email}, {username}]
    })

    if(userAlreadyExists){
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImagePath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImagePath = req.files.coverImage[0].path;
    }
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
        new ApiResponse(200, createdUser,"User registered successfully")
    ) 

});

const loginUser = asyncHandler( async(req, res) => {
    // look for token
    // req.body --> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookies

    const {username, email, password} = req.body;
    if(!(username || email)){
        throw new ApiError(400, "username or email is required.")
    }

    const user = await User.findOne({
        $or: [{username}, {email}],
    })

    if(!user){
        throw new ApiError(404, "User doesn't exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }

    const  {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    // user to send in cookie
    const loggedUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedUser, accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
});

const logoutUser = asyncHandler( async(req, res) => {
    // clear cookies and refresh token
    const id = req.user._id;
    await User.findByIdAndUpdate(id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(
        new ApiResponse(200, {}, "User logged Out")
    )
});

const refreshAccessToken = asyncHandler( async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(incomingRefreshToken){
        throw new ApiError(401, "unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        // now we have to generate access tokens again so use above created method for the same
    
        const options = {
            httpOnly: true,
            secure: true
        };
    
        const {accessToken, nRefreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken",nRefreshToken, options)
        .json(
            new ApiResponse(200,
                {accessToken, refreshToken: nRefreshToken},
                "Access Token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message, "Error refreshing tokens")
    }

});

export {registerUser, loginUser, logoutUser, refreshAccessToken}; 
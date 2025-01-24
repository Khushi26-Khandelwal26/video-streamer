import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import jwt from "jsonwebtoken"

/*Things I need to do in registering user
get user details from user
validation - not empty
check if user already exists : username,email
check for images,check for avatar
upload them to cloudinary,avaatar
create user object - create entry in db
remove password and refresh token field from response
check for user creation 
return res 
*/
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) {
        throw new ApiError(409, "User exists with same username or email");
    }

    const localAvatarpath = req.files?.avatar[0]?.path;
    if (!localAvatarpath) {
        throw new ApiError(400, "Give avatar image");
    }

    let coverImageLocalPath;
    if (req.files?.coverImage?.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    const avatar = await uploadOnCloudinary(localAvatarpath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).lean().select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

//req.body ->data
//username or email
//find the user
//password check
//access and refresh token
//send cookies
const generateAccessAndRefreshToken = async(userID)=>{
    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        
        //hume refreshtoken database me save krwani pdti h
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
        //this means we don't to validate other things...just save the refresh token
        return {accessToken,  refreshToken}

        
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generting refresh and Access token")
    }
}
const loginUser = asyncHandler(async (req,res) =>{
    const {username, email,password} = req.body;
    if(!email && !username){
        throw new ApiError(400,"Email or Username required!")
    }
    //is user me refreshToken empty h
    const user = await User.findOne({
        $or: [{ userName : username }, { email }]
    });
    if(!user){
        throw new ApiError(404,"User Doesn't exist!")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        
        throw new ApiError(401,"Credentials are incorrect")
    }
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")
    // an hamari cookies sirf server modifiable h
    const options = {
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user : loggedinUser, accessToken, refreshToken
            },
            "User loggedIn Successfully!"
        )
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
    //since humne cookie middleware add kra hua h...hum jaise res se cookie access
    //kr skte h...hum waise hi req se bhi cookie access krskte h kyunki yaha pr
    //hum user ko kaise access kre...login ki tarah hum yaha use se username 
    //toh nhi maaang skte..isliye hum uski cookie access krne ki koshish krte h
    //which has tokens to identify the user
    //now with verifyJWT in authmiddleware we got acccess to user
    User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken : undefined,
        }
    },{
        new : true
    })

    const options = {
        httpOnly :true,
        secure : true,
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User logged Out")
    )

})

const refreshAccessToken = asyncHandler(async(req,res) =>{
    //incoming isliye kyunki hamare pass bhi toh ek refresh token h database me 
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken){
            throw new ApiError(401,"Unauthorized request")
        }
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id).select("-password")
        if(!user){
            throw new ApiError(401,"Invalid refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken ){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken , options)
        .cookie("refreshToken" , newRefreshToken , options)
        .json( new ApiResponse(
            200,{accessToken, refreshToken : newRefreshToken}, "Access token granted"
        ))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }

})

const changeCurrentPassword = asyncHandler( async(req,res) =>{
    const {OldPassword , NewPassword, ConfirmPassword} = req.body
    if(NewPassword !== ConfirmPassword){
        throw new ApiError(401, "New Password and Confirm Password don't match")
    }
    //authmiddleware se user id nikal skte h..read verifyJWT code
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = isPasswordCorrect(OldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = NewPassword
    await user.save({validateBeforeSave : false})
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Take the user"))
})
//files update ka fn alg rakha karo
const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullName,email} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "Fullname and email required")
    }
    const user = await User.findbyIdAndUpdate(req.user?._id,
        {
            $set : {
                fullName : fullName,
                email : email
            }
        },
        {new : true} //update hone ke baad return hoti h new : true se
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse( 200, {user}, "Account details updated"))

})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarFilePath = req.file?.path
    if(!avatarFilePath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar  = await uploadOnCloudinary(avatarFilePath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading File")
    }
    await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200 , avatar.url , "Updated Avatar!"))
        
})

const updateCoverImage = asyncHandler(async(req,res) => {
    const coverFilePath = req.file?.path
    if(!coverFilePath) {
        throw new ApiError(400, "CoverImage is required")
    }

    const CoverImage  = await uploadOnCloudinary(coverFilePath)
    if(!CoverImage.url){
        throw new ApiError(400,"Error while uploading cover File")
    }
    await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                coverImage : CoverImage.url
            }
        },
        {new : true}).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200 , CoverImage.url , "Updated Cover Image!"))
        
})

const getUserChannelProfile = asyncHandler(async(req,res) =>{
    const {userName} = req.params
    if(!userName){
        throw new ApiError(400, "User not Found!")
    }
    const channel = await User.aggregate([{
        $match : {userName : userName?.toLowerCase()}
    },
    {
        $lookup : {
            from : "subsciptions",
            localField : "_id",
            foreignField : "channel",
            as : "subscribers"
        }
    },{

        $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField = "subscriber",
            as : "subscribedTo"
        },
    },{
        $addFields : {
            subscribersCount : {$size : "$subscribers"} ,
            subscribedChannelCount : {$size : "$subscribedTo"},
            isSubscribed : {
                $cond : {
                    if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                    then : true,
                    else:false
                }
            }
        }
    },{
        $project : {
            fullName : 1,
            userName : 1,
            avatar : 1,
            subscribedChannelCount : 1,
            subscribersCount : 1,
            coverImage : 1,

        }
    }])
    if(!channel?.length){
        throw new ApiError(404, "Channel not Found!")
    }
    return res.status(200)
    .json(
        new ApiResponse(200,channel[0],"channel details fetched" )
    )
})

const getWatchHistory = asyncHandler(async(req,res) => {
    
})


export 
{registerUser,
loginUser,
logoutUser,
refreshAccessToken,
changeCurrentPassword,
getCurrentUser,
updateAccountDetails,
updateUserAvatar,
updateCoverImage,
getUserChannelProfile,

}
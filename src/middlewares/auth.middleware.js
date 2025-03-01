import {asyncHandler} from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,_,next)=>{
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        //jab hum postman me header me jaate h...authorization me hum "bearer <accessToken>"" dete h
        //mobile ke pass cookies nhi hoti..waha se headers aatae h
    
        if(!accessToken){
            throw new ApiError(401,"Unauthorized Token")
        }
        const decodedToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
    
        const user = User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
        req.user = user;
        next()
        //to move to next function or middleware
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalidd access token")
    }
})






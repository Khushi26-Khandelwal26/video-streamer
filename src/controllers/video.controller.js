import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(404, "You don't have access or maybe user not found!")
    }
    const aggregate  = [{
        $match : {owner : new mongoose.Types.ObjectId(userId)}
    },{
        $lookup : {
            from : "users",
            localField : "owner",
            foreignField : "_id",
            as : "user"
        }
    },{
        $unwind : "$user"
    },{
        $project:{
            videoFile : 1,
            thumbnail : 1,
            title : 1,
            duration : 1,
            views : 1,
            user : {
                userName : 1,
                fullName : 1,
                avatar : 1,

            }


        }
    }]
    
    const options = {
        page : parseInt(page),
        limit : parseInt(limit),
    }


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
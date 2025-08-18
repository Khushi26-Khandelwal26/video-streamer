import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    //verifyjwt in routes
    //like model me phle hi video id ki existence verify hogyi
    // const video = await Video.findById(videoId);
    // if(!video){
    //     throw new ApiError(404, "Video doesn't exist")
    // }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid video ID");
        }


    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    let message;
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        message = "Like removed Succesfully"
    }
    else {
        await Like.create({
            video: videoId,
            likedBy: userId
        })
        message = "Video Liked!"
    }

    return res.status(200).json(
        new ApiResponse(200, {}, message)
    );


});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user._id


    //It got verifiied in like model using pre functionality provided by mongoose
    // const comment = await Comment.findById(commentId)     
    // if(!comment){
    //     throw new ApiError(404 ,"Comment doesn't exist")
    // }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
            throw new ApiError(400, "Invalid comment ID");
        }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })

    let message;
    if (existingLike) {
        await existingLike.deleteOne();
        message = "Liked removed from comment"
    }
    else {
        await Like.create({
            comment: commentId,
            likedBy: userId
        })
        message = "Comment Liked!"
    }

    return res.status(200).json(
        new ApiResponse(200, { commentId, likedBy: userId }, message)
    );

});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit


    const likedVideos = await Like.find({
        likedBy: userId,
        video: { $exists: true, $ne: null }
    })
        .populate({
            path: "video",                  // populate the 'video' field from Like
            populate: {
                path: "owner",                // inside video, populate the 'owner' field
                select: "fullName avatar"     // only fetch these fields
            }
        })

        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

    const totalLikes = await Like.countDocuments({
        likedBy: userId,
        video: { $exists: true, $ne: null }
    })

    res.status(200).json(
        new ApiResponse(200, {
            videos: likedVideos.map(like => like.video),
            pagination: {
                total: totalLikes,
                limit,
                page,
                totalPages: Math.ceil(totalLikes / limit)

            }
        }, "Fetched all liked videos Succesfully")
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
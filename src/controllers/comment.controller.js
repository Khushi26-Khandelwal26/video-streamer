import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import User from '../models/user.model.js'
import Video from "../controllers/video.controller.js"


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Aggregation pipeline to fetch comments with user details
    const aggregate = [
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },  // Match comments for the video
        { 
            $lookup: {  
                from: "users",  // Join with User collection
                localField: "owner", 
                foreignField: "_id", 
                as: "owner" 
            } 
        },
        { $unwind: "$owner" },  // Convert owner array into an object
        { 
            $project: {  // Select required fields
                content: 1,
                createdAt: 1,
                owner: { userName: 1, fullName: 1, avatar: 1 } 
            } 
        }
    ];

    // Pagination options
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    // Execute aggregation with pagination
    const { docs: comments, totalDocs: totalComments, totalPages, page: currentPage } = 
        await Comment.aggregatePaginate(Comment.aggregate(aggregate), options);

    return res.status(200).json(
        new ApiResponse(200, { comments, totalComments, totalPages, currentPage }, "Comments fetched successfully")
    );
});




const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;
    
    // Validate User
    const user = await User.findById(req.user?.id);
    if (!user) {
        throw new ApiError(404, "User doesn't exist");
    }

    // Validate Content
    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    // Validate Video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Create Comment
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: user._id,
    });

    // Send Response
    return res.status(201).json(
        new ApiResponse(201,{ comment }, "Comment added successfully" )
    );
});
    
const updateComment = asyncHandler(async (req, res) => {
    const { newComment } = req.body;
    const { commentId, videoId } = req.params;

    // Validate new comment input
    if (!newComment || newComment.trim() === "") {
        throw new ApiError(400, "New comment content is required");
    }

    // Fetch video and comment in parallel for efficiency
    const [video, comment] = await Promise.all([
        Video.findById(videoId),
        Comment.findById(commentId)
    ]);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Ensure the user owns the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment");
    }

    // Update the comment
    comment.content = newComment;
    await comment.save();

    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});


const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment");
    }
    await Comment.findByIdAndDelete(commentId);
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted Successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import Video from "../models/video.model.js"; // ✅ Correct: import model, not controller

// Get comments for a video with pagination
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const aggregate = [
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                content: 1,
                createdAt: 1,
                owner: { userName: 1, fullName: 1, avatar: 1 }
            }
        }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    const { docs: comments, totalDocs: totalComments, totalPages, page: currentPage } =
        await Comment.aggregatePaginate(Comment.aggregate(aggregate), options);

    return res.status(200).json(
        new ApiResponse(200, { comments, totalComments, totalPages, currentPage }, "Comments fetched successfully")
    );
});

// Add a new comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    if (!content) throw new ApiError(400, "Comment content is required");

    const user = await User.findById(req.user?.id);
    if (!user) throw new ApiError(404, "User not found");

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: user._id,
    });

    return res.status(201).json(
        new ApiResponse(201, { comment }, "Comment added successfully")
    );
});

// Update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { newComment } = req.body;
    const { commentId, videoId } = req.params;

    if (!newComment || newComment.trim() === "") {
        throw new ApiError(400, "New comment content is required");
    }

    if (!isValidObjectId(videoId) || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid ID(s)");
    }

    const [video, comment] = await Promise.all([
        Video.findById(videoId),
        Comment.findById(commentId)
    ]);

    if (!video) throw new ApiError(404, "Video not found");
    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment");
    }

    comment.content = newComment;
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    );
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};

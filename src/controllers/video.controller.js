import mongoose, { isValidObjectId, Mongoose } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { deleteFromCloudinary } from "../utils/cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    let { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;

    page = Number(page) > 0 ? Number(page) : 1;
    limit = Number(limit) > 0 && Number(limit) <= 50 ? Number(limit) : 10;

    const allowedSortFields = ["createdAt", "views", "title", "duration"];
    if (!allowedSortFields.includes(sortBy)) {
        sortBy = "createdAt";
    }

    const sortOrder = sortType === "asc" ? 1 : -1;

    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                isPublished: true,
            }
        },
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
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.fullName": 1,
                "owner.avatar": 1
            }
        },
        { $sort: { [sortBy]: sortOrder } }
    ];

    const options = { page, limit };

    const result = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    return res.status(200).json(
        new ApiResponse(200, result, "All videos fetched successfully")
    );

})

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  if (!title || !description) {
    throw new ApiError(404, "Title or description is missing")
  }

  if (!req.files?.videoFile?.[0]?.path || !req.files?.thumbnail?.[0]?.path) {
    throw new ApiError(404, "Upload both Video and Thumbnail")
  }

  const videoUpload = await uploadOnCloudinary(req.files.videoFile[0].path)
  const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path)

  if (!videoUpload || !thumbnailUpload) {
    throw new ApiError(500, "Error while uploading video or thumbnail")
  }

  const video = await Video.create({
    videoFile: {
      url: videoUpload.secure_url,
      public_id: videoUpload.public_id
    },
    thumbnail: {
      url: thumbnailUpload.secure_url,
      public_id: thumbnailUpload.public_id
    },
    title,
    description,
    duration: Math.floor(videoUpload.duration || 0),
    isPublished: true,
    owner: req.user._id
  })

  return res.status(201).json(
    new ApiResponse(200, video, "Video Published")
  )
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    let video = await Video.findById(videoId).populate({
        path: "owner",
        select: { userName: 1, fullName: 1, avatar: 1 }
    });

    if (!video) {
        throw new ApiError(404, "Video not Found");
    }

    // If viewer is not the owner, increment views
    if (req.user && video.owner._id.toString() !== req.user._id.toString()) {
        video.views += 1;
        await video.save();
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
});


const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { title, description } = req.body

  const video = await Video.findById(videoId)
  if (!video) throw new ApiError(404, "Video Not Found")

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, "You don't have permission to update this video")
  }

  if (title) video.title = title
  if (description) video.description = description

  if (req.files?.thumbnail?.[0]?.path) {
    // delete old one from Cloudinary
    await deleteFromCloudinary(video.thumbnail.public_id, "image")

    // upload new one
    const newThumb = await uploadOnCloudinary(req.files.thumbnail[0].path)
    video.thumbnail = {
      url: newThumb.secure_url,
      public_id: newThumb.public_id
    }
  }

  await video.save()

  return res.status(200).json(
    new ApiResponse(200, video, "Video updated successfully")
  )
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  const video = await Video.findById(videoId)
  if (!video) throw new ApiError(404, "Video Not Found")

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, "You don't have permission to delete this video")
  }

  await deleteFromCloudinary(video.videoFile.public_id, "video")
  await deleteFromCloudinary(video.thumbnail.public_id, "image")

  await video.deleteOne()

  return res.status(200).json(
    new ApiResponse(200, {}, "Video deleted successfully")
  )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const userId = req.user._id;
    if (!video.owner.equals(userId)) {
        throw new ApiError(403, "You don't have access to update this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    const message = video.isPublished ? "Published" : "Unpublished";

    return res.status(200).json(
        new ApiResponse(200, video, message)
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
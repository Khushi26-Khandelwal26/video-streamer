import mongoose, {Schema} from "mongoose";
import {Comment} from "../models/comment.model"
import {Video} from "../models/video.model"
import {ApiError} from "../utils/ApiError"

const likeSchema = new Schema({
    video : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    comment : {
        type : Schema.Types.ObjectId,
        ref : "Comment"
    },
    tweet : {
        type : Schema.Types.ObjectId,
        ref : "Tweet"
    },
    likedBy : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps : true})

likeSchema.pre("save", async function () {
    if (this.comment) {
        const exists = await Comment.exists({ _id: this.comment });
        if (!exists) {
            throw new ApiError(400, "Comment doesn't exist");
        }
    }
    if (this.video) {
        const exists = await Video.exists({ _id: this.video });
        if (!exists) {
            throw new ApiError(400, "Video doesn't exist");
        }
    }
});

likeSchema.index({ video: 1, likedBy: 1 }, { unique: true, partialFilterExpression: { video: { $exists: true } } });
likeSchema.index({ comment: 1, likedBy: 1 }, { unique: true, partialFilterExpression: { comment: { $exists: true } } });

export const Like = mongoose.model("Like", likeSchema)
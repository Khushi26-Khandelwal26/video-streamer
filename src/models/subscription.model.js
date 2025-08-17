import mongoose, { Schema } from "mongoose";
import { User } from "./user.model.js";
import { ApiError } from "../utils/ApiError.js";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a user cannot subscribe to the same channel twice
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

// Pre-save hook to validate that the channel exists
subscriptionSchema.pre("save", async function (next) {
  try {
    if ( this.channel) {
      const exists = await User.exists({ _id: this.channel });
      if (!exists) {
        return next(new ApiError(404, "Channel doesn't exist"));
      }
    }
    next();
  } catch (error) {
    next(new ApiError(500, "Validation error in Subscription model"));
  }
});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);

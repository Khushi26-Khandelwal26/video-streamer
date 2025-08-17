import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


// TODO: toggle subscription
//verifyJWT
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user._id

    // const channel = await User.findById(channelId)
    // if(!channel){
    //     throw new ApiError(404,"Channel Doesn't exist")
    // }

    const subscribed = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    let message;
    if (subscribed) {
        await subscribed.deleteOne();
        message = "Unsubscribed";
    }
    else {
        await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
        message = "Subscribed"
    }
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    return res.status(200).json(
        new ApiResponse(200, { totalSubscribers }, message)
    )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const subscribers = await Subscription.find({
        channel: channelId,
        subscriber: { $exists: true, $ne: null }
    })
        .populate({
            path: "subscriber",
            select: "fullName avatar"
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    return res.status(200).json(
        new ApiResponse(200, {
            subscribers: subscribers.map(subscription => subscription.subscriber),
            pagination: {
                total: totalSubscribers,
                limit,
                page,
                totalPages: Math.ceil(totalSubscribers / limit)
            }
        }, "Subscribers fetched")
    );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user._id; // safer than taking from params

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const channelsSubscribed = await Subscription.find({
        subscriber: subscriberId,
        channel: { $exists: true, $ne: null }
    })
        .populate({
            path: "channel",
            select: "fullName avatar"
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalSubscribedChannels = await Subscription.countDocuments({ subscriber: subscriberId });

    return res.status(200).json(
        new ApiResponse(200, {
            channelsSubscribed: channelsSubscribed.map(subscription => subscription.channel),
            pagination: {
                total: totalSubscribedChannels,
                limit,
                page,
                totalPages: Math.ceil(totalSubscribedChannels / limit)
            }
        }, "Subscribed channels fetched")
    );
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
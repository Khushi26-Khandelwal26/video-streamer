import mongoose,{Schema} from "mongoose";
import { JsonWebTokenError } from "jsonwebtoken";
import bcrypt from bcrypt;
const userSchema = new Schema({
    userName : {
        type : String,
        required: true,
        unique : true,
        lowercase : true,
        index : true,
        trim : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    },
    password : {
        type : String,
        required : [true, "Password is required!"]

    },
    fullName : {
        type :String,
        index : true,
        trim : true,
        required : true,
    },
    avatar : {
        type : String, //cloudnary url
        required : true,
    },
    coverImage : {
        type : String //cloudnary link
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId, // we specify ref when we use objectID
            ref : "Video"
        }
    ],
    refreshToken : {
        type : String,
    }

},
{
    timestamps : true
}
)
//pre is a hook(mongoose middleware),arrow function me this ka context nhi milta
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next
    this.password = bcrypt.hash(this.password, 10)
    next()
})
//is tareeke se method apne schema me inject kr skate h
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken =  function(){
    return JsonWebToken.sign(
        {
            _id : this._id,
            email : this.email,
            userName : this.userName,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken =  function(){
    return JsonWebToken.sign(
        {
            _id : this._id,
            email : this.email,
            userName : this.userName,
            fullName : this.fullName
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)
import {registerUser} from "../controllers/user.controller.js"
import {Router} from "express"
import {upload} from "../middlewares/multer.middleware.js"
import {loginUser} from "../controllers/user.controller.js"
import {logoutUser} from "../controllers/user.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { refreshAccessToken } from "../controllers/user.controller.js"
import {changeCurrentPassword} from "../controllers/user.controller.js"
import {getCurrentUser} from "../controllers/user.controller.js"
import {updateAccountDetails} from "../controllers/user.controller.js"
import {updateUserAvatar} from "../controllers/user.controller.js"
import {updateCoverImage} from "../controllers/user.controller.js"
import {getUserChannelProfile} from "../controllers/user.controller.js"
import {getWatchHistory} from "../controllers/user.controller.js"


//we use middleware before going to userRegister function...upload middleware
const router = Router()
router.route("/register").post(
    upload.fields([
    {
        name : "avatar",
        maxCount : 1
    },
    {
        name : "coverImage",
        maxCount : 1

    }]),
registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account-details").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)



export default router
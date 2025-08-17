import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoComments } from "../controllers/comment.controller.js";
import { addComment } from "../controllers/comment.controller.js";
import { deleteComment } from "../controllers/comment.controller.js";
import { updateComment } from "../controllers/comment.controller.js";


const router = Router()

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

// router.route("/getVideoComment").get(getVideoComments)
// router.route("/addComment").post(addComment)
// router.route("/updateComment").patch(updateComment)
// router.route("/deleteComment").patch(deleteComment)
export default router;
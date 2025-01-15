import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
//ye filename return krdega... toh ise hum cloudinary pr upload kr sakenge
  
export const upload = multer({ storage })


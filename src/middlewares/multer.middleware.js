import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
    //to create a unique file name
}
  })
//ye filename return krdega... toh ise hum cloudinary pr upload kr sakenge
  
export const upload = multer({ storage })


import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";
//database se jb bhi connect kro toh async await lagao..kyunki database
//se aane me time lgta h aur try and catch lagao kyunki error aane ki chances
//hote h 

dotenv.config({
    path: "./env"
})
//async code returns a promise....so we can use .then with connect db
connectDB()
// we use app.use for middlewares
.then(()=>{
    app.on("error",(error)=>{
        console.log("Express is not able to connect to MongoDB",error);
        throw error
    })
    app.listen(process.env.PORT|| 8000,()=>{
        console.log(`Server is running at port ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("MongoDB connection Failed",error)
})

// this is the first approach to connect to db
/*const app = express();
;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("error",error);
            throw error
        })
        //this is a listener..its work is sometimes dtabase connect ho jaata h
        //but express database se baat nhi kr paa rha hota h
app.listen(process.env.PORT,()=>{
    console.log(`App is listening on port ${process.env.PORT}`)
})
    } catch (error) {
        console.error("Error", error)
    }
})() //this is iffe in javascript

*/

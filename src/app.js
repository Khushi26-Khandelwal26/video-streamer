import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
 app.use(express.json({limit:"16kb"})) //for handling json data...read about it
 app.use(express.urlencoded({extended : true,limit : "16kb"}))
 app.use(express.static("public"))// to store files..in that public folder

 app.use(cookieParser())

export {app}
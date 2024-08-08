import 'dotenv/config'

import mongoose from "mongoose";
import express from "express";
import connectDB from "./db/index.js";

connectDB()
.then( () => {
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server started at : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.error("Error connecting MongoDB : ", err);
    
})

const app = express();


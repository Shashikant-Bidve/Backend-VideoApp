import 'dotenv/config'
import { app } from './app.js';

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



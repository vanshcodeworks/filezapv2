import mongoose from "mongoose";
import express from "express";
import { home } from "../controllers/home.controller";

const router = express.Router()

router.get("/hey" , home)

export default router
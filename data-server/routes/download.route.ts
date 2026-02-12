import express from "express";
import { download } from "../controllers/download.controller";
const router = express.Router();

// router.get("/" , nothing );
router.get("/:id" , download);


export default router;
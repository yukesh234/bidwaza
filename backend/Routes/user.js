import express from "express";
import { uploadProfile } from "../Controller/user.Controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post("/uploadprofile", upload.single("file"), uploadProfile);

export default router;

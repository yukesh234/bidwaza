import express from "express";
import { editprofile, uploadProfile, getallProducts, getProductById, getOrderHistory } from "../Controller/user.Controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/uploadprofile", upload.single("file"),authenticateToken, uploadProfile);
router.post("/editprofile", upload.single("file"),authenticateToken, editprofile)
router.get("/getProducts",getallProducts )
router.get("/getProductsByid/:ItemId", getProductById);
router.get("/getOrderHistory", authenticateToken, getOrderHistory)
export default router;

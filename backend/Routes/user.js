import express from "express";
import { editprofile, uploadProfile, getallProducts, getProductById, getOrderHistory, addOrUpdateReview, updateName, getBiddedProducts } from "../Controller/user.Controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/uploadprofile", upload.single("file"),authenticateToken, uploadProfile);
router.put("/editprofile", upload.single("file"),authenticateToken, editprofile)
router.get("/getProducts",getallProducts )
router.get("/getProductsByid/:ItemId", getProductById);
router.get("/getOrderHistory", authenticateToken, getOrderHistory)
router.post("/addReviewsAndRatings",authenticateToken,addOrUpdateReview );
router.put('/updateName',authenticateToken, updateName);
router.get('/getbiddedProducts',authenticateToken,getBiddedProducts);
export default router;

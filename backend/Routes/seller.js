import express from "express";
import {addProduct, getSellerProducts} from '../Controller/seller.Controller.js'
import {authenticateToken} from '../middleware/auth.middleware.js'
import { upload } from "../middleware/multer.middleware.js";
const router = express.Router();

router.post('/addProduct',authenticateToken, upload.array("files") ,addProduct )

router.get("/getproducts", authenticateToken, getSellerProducts);


export default router;


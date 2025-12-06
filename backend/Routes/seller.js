import express from "express";
import {addProduct, getSellerOrders, getSellerProducts, sellerstats, updateOrderStatus, updateStatus, updateStock,editProduct, deleteProduct} from '../Controller/seller.Controller.js'
import {authenticateToken} from '../middleware/auth.middleware.js'
import { upload } from "../middleware/multer.middleware.js";
const router = express.Router();

router.post('/addProduct',authenticateToken, upload.array("files") ,addProduct )

router.get("/getproducts", authenticateToken, getSellerProducts);
router.get('/getsellerOrders', authenticateToken, getSellerOrders);
router.put('/updateOrderStatus', authenticateToken, updateOrderStatus);
router.put("/updatestock", authenticateToken, updateStock );
router.put("/updatestatus", authenticateToken, updateStatus)
router.get("/getSellerstats", authenticateToken, sellerstats)
router.patch('/updateProduct/:ProductId', authenticateToken, upload.array("files",5),editProduct );
router.delete('/deleteProduct/:productId', authenticateToken,deleteProduct);
export default router;


import express from 'express'
import { addtocart, clearCart, getCart, removefromcart, updateCartItemQuantity } from '../Controller/cart.Controller.js';
import {authenticateToken} from '../middleware/auth.middleware.js'
const router = express.Router();

router.post("/add-to-cart", authenticateToken, addtocart)
router.get("/getcart",authenticateToken,getCart)
router.delete("/removecartitems/:cartItemId", authenticateToken, removefromcart )
router.delete("/clear-cart", authenticateToken, clearCart)
router.patch("/update-quantity/:cartItemId", authenticateToken,updateCartItemQuantity)
export default router;
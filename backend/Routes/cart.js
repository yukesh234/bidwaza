import express from 'express'
import { addtocart } from '../Controller/cart.Controller.js';
import {authenticateToken} from '../middleware/auth.middleware.js'
const router = express.Router();

router.post("/add-to-cart", authenticateToken, addtocart)


export default router;
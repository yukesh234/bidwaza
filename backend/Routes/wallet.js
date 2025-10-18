import express from 'express'
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getHistory, pay, verifyPayment } from '../Controller/wallet.Controller.js';



const router = express.Router();

router.post('/pay',authenticateToken,pay);
router.post('/verify',authenticateToken,verifyPayment)
router.get('/history',authenticateToken,getHistory);
export default router;
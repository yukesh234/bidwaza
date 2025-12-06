import express from 'express'
import {authenticateToken} from '../middleware/auth.middleware.js'
import { getAuctionStats, getCategoryRevenue, getMonthlySales, getProductPerformance, getSellerSalesLast7Days, getTopProducts } from '../Controller/analytics.js';



const router = express.Router();


router.get("/last7days",authenticateToken,getSellerSalesLast7Days)
router.get('/monthly-sales', authenticateToken, getMonthlySales);
router.get('/product-performance', authenticateToken, getProductPerformance);
router.get('/category-revenue', authenticateToken, getCategoryRevenue);
router.get('/top-products', authenticateToken, getTopProducts);
router.get('/auction-stats', authenticateToken, getAuctionStats);

export default router;
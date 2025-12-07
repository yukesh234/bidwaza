import express from 'express';
import auctionService from '../Service/auctionService.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { cancelAutoBid, checkRegistration, getAuctionDetails, getAutoBid, getmyBids, getNotifications, getwins, placeBid, registerForProduct, setAutoBid, setnotificationasread } from '../Controller/auction.Controller.js';

const router = express.Router();

// Place a bid
router.post('/placeBid', authenticateToken, placeBid);

// Register for auction
router.post('/registerForProduct', authenticateToken, registerForProduct);

// Get auction details with bid history
router.get('/auction/:itemId', authenticateToken, getAuctionDetails);

// Get user's active bids
router.get('/myBids', authenticateToken, getmyBids);

// Get user's won auctions
router.get('/myWins', authenticateToken, getwins);

// Get notifications
router.get('/notifications', authenticateToken, getNotifications);

// Mark notification as read
router.put('/notifications/:notificationId/read', authenticateToken, setnotificationasread);

router.get('/checkRegistration/:itemId', authenticateToken,checkRegistration )


router.post('/setAutoBid', authenticateToken, setAutoBid);
router.delete('/cancelAutoBid/:itemId', authenticateToken, cancelAutoBid);
router.get('/getAutoBid/:itemId', authenticateToken, getAutoBid);

export default router;
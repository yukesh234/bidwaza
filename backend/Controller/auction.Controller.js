import auctionService from '../Service/auctionService.js';
import { getConnection } from "../Db/Db.js";

export async function placeBid(req,res){
      try {
        const { itemId, bidAmount } = req.body;
        // Handle both uppercase and lowercase user ID
        const userId = req.user.id || req.user.ID;
        const io = req.app.get('io');
    
        if (!itemId || !bidAmount) {
          return res.status(400).json({
            success: false,
            message: 'Item ID and bid amount are required'
          });
        }
    
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: 'User not authenticated'
          });
        }
    
        const result = await auctionService.placeBid(userId, itemId, bidAmount, io);
        
        res.json(result);
      } catch (error) {
        console.error('Error placing bid:', error);
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to place bid'
        });
      }
}

export async function registerForProduct(req,res)
{
     try {
        const { itemId } = req.body;
        const userId = req.user.ID;
    
        console.log(req.body)
    
        if (!itemId) {
          return res.status(400).json({
            success: false,
            message: 'Item ID is required'
          });
        }
    
        const result = await auctionService.registerForAuction(userId, itemId);
        
        res.json(result);
      } catch (error) {
        console.error('Error registering for auction:', error);
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to register for auction'
        });
      }
}


export async function getAuctionDetails(req, res) {
  try {
    const { itemId } = req.params;
    const userId = req.user?.ID;

    const result = await auctionService.getAuctionDetails(itemId, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting auction details:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get auction details'
    });
  }
}

export async function getmyBids(req,res)
{
    try {
    const userId = req.user.ID;
    const oracledb = await import('oracledb');
    const { getConnection } = await import('../Db/Db.js');
    
    const connection = await getConnection();

    const result = await connection.execute(
      `SELECT b.bid_id, b.item_id, b.bid_amount, b.bid_status, b.created_at,
              p.title, p.product_type, p.current_price, p.end_time,
              pi.image_url
       FROM bids b
       JOIN products p ON b.item_id = p.item_id
       LEFT JOIN product_images pi ON p.item_id = pi.item_id AND pi.is_primary = 'Y'
       WHERE b.user_id = :userId
       AND b.bid_status IN ('WINNING', 'OUTBID', 'ACTIVE')
       ORDER BY b.created_at DESC`,
      { userId }
    );

    const bids = result.rows.map(row => ({
      bidId: row[0],
      itemId: row[1],
      bidAmount: row[2],
      bidStatus: row[3],
      createdAt: row[4],
      productTitle: row[5],
      productType: row[6],
      currentPrice: row[7],
      endTime: row[8],
      imageUrl: row[9]
    }));

    await connection.close();

    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('Error getting user bids:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user bids'
    });
  }
}

export async function getwins(req,res)
{
      try {
        const userId = req.user.ID;
        const oracledb = await import('oracledb');
        const { getConnection } = await import('../Db/Db.js');
        
        const connection = await getConnection();
    
        const result = await connection.execute(
          `SELECT aw.winner_id, aw.item_id, aw.winning_bid, aw.payment_status, aw.created_at,
                  p.title, p.description,
                  pi.image_url
           FROM auction_winners aw
           JOIN products p ON aw.item_id = p.item_id
           LEFT JOIN product_images pi ON p.item_id = pi.item_id AND pi.is_primary = 'Y'
           WHERE aw.user_id = :userId
           ORDER BY aw.created_at DESC`,
          { userId }
        );
    
        const wins = result.rows.map(row => ({
          winnerId: row[0],
          itemId: row[1],
          winningBid: row[2],
          paymentStatus: row[3],
          createdAt: row[4],
          productTitle: row[5],
          productDescription: row[6],
          imageUrl: row[7]
        }));
    
        await connection.close();
    
        res.json({
          success: true,
          data: wins
        });
      } catch (error) {
        console.error('Error getting user wins:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get user wins'
        });
      }
}

export async function getNotifications(req,res)
{
      try {
    const userId = req.user.ID;
    const { limit = 20, unreadOnly = false } = req.query;
    
    const oracledb = await import('oracledb');
    const { getConnection } = await import('../Db/Db.js');
    
    const connection = await getConnection();

    let query = `
      SELECT notification_id, type, title, message, item_id, is_read, created_at
      FROM notifications
      WHERE user_id = :userId
    `;

    if (unreadOnly === 'true') {
      query += ` AND is_read = 'N'`;
    }

    query += ` ORDER BY created_at DESC FETCH FIRST :limit ROWS ONLY`;

    const result = await connection.execute(query, { userId, limit: parseInt(limit) });

    const notifications = result.rows.map(row => ({
      notificationId: row[0],
      type: row[1],
      title: row[2],
      message: row[3],
      itemId: row[4],
      isRead: row[5] === 'Y',
      createdAt: row[6]
    }));

    await connection.close();

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
}

export async function setnotificationasread(req,res)
{
      try {
    const userId = req.user.ID;
    const { notificationId } = req.params;
    
    const oracledb = await import('oracledb');
    const { getConnection } = await import('../Db/Db.js');
    
    const connection = await getConnection();

    await connection.execute(
      `UPDATE notifications 
       SET is_read = 'Y' 
       WHERE notification_id = :notificationId AND user_id = :userId`,
      { notificationId, userId }
    );

    await connection.commit();
    await connection.close();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
}

// Update your backend endpoint
export async function checkRegistration(req, res) {
  // If user is not authenticated, return false
  if (!req.user || !req.user.ID) {
    return res.json({
      success: true,
      registered: false
    });
  }

  const userId = req.user.ID;
  const { itemId } = req.params;
  
  let connection;
  
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT COUNT(*) as count FROM auction_registrations
       WHERE item_id = :itemId AND user_id = :userId`,
      { itemId, userId }
    );
    
    const count = result.rows[0][0];
    const isRegistered = count > 0;
    
    console.log(`Registration check - User: ${userId}, Item: ${itemId}, Registered: ${isRegistered}`);
    
    res.json({
      success: true,
      registered: isRegistered
    });
    
  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check registration',
      registered: false
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}
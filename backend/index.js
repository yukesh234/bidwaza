import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authrouter from './Routes/auth.js';
import user from './Routes/user.js';
import seller from './Routes/seller.js';
import cart from './Routes/cart.js';
import esewa from './Routes/esewa.js';
import wallet from './Routes/wallet.js';
import auctionRoutes from './Routes/auction.js';
import auctionService from './Service/auctionService.js';
import analytics from './Routes/analytics.js'
import { getConnection } from './Db/Db.js';

const app = express();
const httpServer = createServer(app);

// Initialize socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "*"
    ],
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json());

// Make io available to routes
app.set('io', io);

// Routes
app.use("/", authrouter);
app.use("/user", user);
app.use("/seller", seller);
app.use("/cart", cart);
app.use("/esewa", esewa);
app.use("/wallet", wallet);
app.use("/auction", auctionRoutes);
app.use("/analytics",analytics)
app.get("/status", (req, res) => res.send({ message: "Hello" }));

// Track connected users
const connectedUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on('authenticate', (userId) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      socket.join(`user_${userId}`);
      console.log(`🔐 User ${userId} authenticated with socket ${socket.id}`);
    }
  });

  socket.on('join-auction', (itemId) => {
    socket.join(`auction_${itemId}`);
    console.log(`🏠 Socket ${socket.id} joined auction room: auction_${itemId}`);
    
    socket.to(`auction_${itemId}`).emit('user-joined', {
      itemId,
      timestamp: new Date()
    });
  });

  socket.on('leave-auction', (itemId) => {
    socket.leave(`auction_${itemId}`);
    console.log(`🚪 Socket ${socket.id} left auction room: auction_${itemId}`);
  });

  socket.on('place-bid', async (data, callback) => {
    try {
      const { itemId, bidAmount, userId } = data;

      if (!userId || !itemId || !bidAmount) {
        return callback({
          success: false,
          message: 'Missing required fields'
        });
      }

      const result = await auctionService.placeBid(userId, itemId, bidAmount, io);
      
      callback({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('Socket bid error:', error);
      callback({
        success: false,
        message: error.message || 'Failed to place bid'
      });
    }
  });

  socket.on('get-auction-status', async (itemId, callback) => {
    try {
      const result = await auctionService.getAuctionDetails(itemId);
      callback({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Error getting auction status:', error);
      callback({
        success: false,
        message: error.message || 'Failed to get auction status'
      });
    }
  });

  socket.on('bidding-activity', (data) => {
    socket.to(`auction_${data.itemId}`).emit('user-activity', {
      itemId: data.itemId,
      activity: 'preparing_bid',
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(` User disconnected: ${socket.id}`);
    
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`🔓 User ${userId} disconnected`);
        break;
      }
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Auction scheduler - checks for ending auctions every minute
setInterval(async () => {
  try {
    await checkEndingAuctions(io);
  } catch (error) {
    console.error('Error in auction scheduler:', error);
  }
}, 60000);

// Function to check and handle ending auctions
async function checkEndingAuctions(io) {
  let connection;
  try {
    connection = await getConnection();

    // Find auctions ending in the next 5 minutes
    const endingSoonResult = await connection.execute(
      `SELECT p.item_id, p.title, p.end_time,
              b.user_id, b.bid_amount,
              u.first_name || ' ' || u.last_name as bidder_name
       FROM products p
       LEFT JOIN bids b ON p.item_id = b.item_id AND b.bid_status = 'WINNING'
       LEFT JOIN users u ON b.user_id = u.id
       WHERE p.product_type IN ('AUCTION', 'REGISTRATION')
       AND p.status = 'ACTIVE'
       AND p.end_time BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '5' MINUTE`
    );

    for (const row of endingSoonResult.rows) {
      const itemId = row[0];
      const title = row[1];
      const endTime = row[2];
      const winnerId = row[3];

      const timeLeft = Math.floor((new Date(endTime) - new Date()) / 1000 / 60);
      
      io.to(`auction_${itemId}`).emit('auction-ending', {
        itemId,
        productTitle: title,
        timeLeft: `${timeLeft} minutes`,
        currentWinner: winnerId
      });
    }

    // Find auctions that just ended
    const endedAuctionsResult = await connection.execute(
      `SELECT p.item_id, p.title, p.seller_id,
              b.bid_id, b.user_id as winner_id, b.bid_amount,
              u.first_name || ' ' || u.last_name as winner_name
       FROM products p
       LEFT JOIN bids b ON p.item_id = b.item_id AND b.bid_status = 'WINNING'
       LEFT JOIN users u ON b.user_id = u.id
       WHERE p.product_type IN ('AUCTION', 'REGISTRATION')
       AND p.status = 'ACTIVE'
       AND p.end_time < CURRENT_TIMESTAMP
       AND NOT EXISTS (
         SELECT 1 FROM auction_winners w WHERE w.item_id = p.item_id
       )`
    );

    for (const row of endedAuctionsResult.rows) {
      const itemId = row[0];
      const title = row[1];
      const sellerId = row[2];
      const winningBidId = row[3];
      const winnerId = row[4];
      const winningAmount = row[5];
      const winnerName = row[6];

      if (winnerId) {
        await processAuctionWinner(connection, itemId, winnerId, winningAmount, sellerId, io);

        await connection.execute(
          `UPDATE bids 
           SET bid_status = 'LOST', updated_at = CURRENT_TIMESTAMP
           WHERE item_id = :itemId AND bid_status IN ('OUTBID', 'ACTIVE')`,
          { itemId }
        );

        io.to(`user_${winnerId}`).emit('auction-won', {
          itemId,
          productTitle: title,
          winningAmount
        });

        io.to(`auction_${itemId}`).emit('auction-ended', {
          itemId,
          productTitle: title,
          winnerId,
          winnerName,
          winningAmount
        });
      } else {
        await connection.execute(
          `UPDATE products SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
           WHERE item_id = :itemId`,
          { itemId }
        );

        io.to(`auction_${itemId}`).emit('auction-ended', {
          itemId,
          productTitle: title,
          noWinner: true
        });
      }
    }

    await connection.commit();

  } catch (error) {
    console.error('Error checking ending auctions:', error);
    if (connection) {
      await connection.rollback();
    }
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Process auction winner - transfer funds and create winner record
async function processAuctionWinner(connection, itemId, winnerId, winningAmount, sellerId, io) {
  try {
    // 1. Create auction winner record (winner_id is PRIMARY KEY, needs sequence)
    await connection.execute(
      `INSERT INTO auction_winners 
       (winner_id, item_id, user_id, winning_bid, payment_status, created_at)
       VALUES (winner_seq.NEXTVAL, :itemId, :userId, :winningBid, 'PENDING', CURRENT_TIMESTAMP)`,
      { itemId, userId: winnerId, winningBid: winningAmount }
    );

    // 2. Get winner's wallet and active hold
    const holdResult = await connection.execute(
      `SELECT wh.hold_id, wh.wallet_id, wh.amount
       FROM wallet_holds wh
       JOIN bids b ON wh.bid_id = b.bid_id
       WHERE b.item_id = :itemId AND b.user_id = :winnerId 
       AND wh.status = 'ACTIVE' AND b.bid_status = 'WINNING'`,
      { itemId, winnerId }
    );

    if (holdResult.rows.length === 0) {
      throw new Error('Winner wallet hold not found');
    }

    const holdId = holdResult.rows[0][0];
    const winnerWalletId = holdResult.rows[0][1];

    // 3. Capture the hold
    await connection.execute(
      `UPDATE wallet_holds 
       SET status = 'CAPTURED', released_at = CURRENT_TIMESTAMP
       WHERE hold_id = :holdId`,
      { holdId }
    );

    // 4. Deduct from winner's wallet
    await connection.execute(
      `UPDATE wallets 
       SET balance = balance - :amount, last_updated = CURRENT_TIMESTAMP
       WHERE wallet_id = :walletId`,
      { amount: winningAmount, walletId: winnerWalletId }
    );

    // 5. Add to seller's wallet
    const sellerWalletResult = await connection.execute(
      `SELECT wallet_id FROM wallets WHERE user_id = :sellerId`,
      { sellerId }
    );

    if (sellerWalletResult.rows.length > 0) {
      const sellerWalletId = sellerWalletResult.rows[0][0];

      await connection.execute(
        `UPDATE wallets 
         SET balance = balance + :amount, last_updated = CURRENT_TIMESTAMP
         WHERE wallet_id = :walletId`,
        { amount: winningAmount, walletId: sellerWalletId }
      );

      // Record transaction (removed transaction_id - IDENTITY column)
      await connection.execute(
        `INSERT INTO wallet_topup_history 
         (wallet_id, amount, transaction_type, status, created_at)
         VALUES (:walletId, :amount, 'AUCTION_PAYMENT', 'COMPLETED', CURRENT_TIMESTAMP)`,
        { walletId: sellerWalletId, amount: winningAmount }
      );
    }

    // 6. Update winning bid status
    await connection.execute(
      `UPDATE bids 
       SET bid_status = 'WON', updated_at = CURRENT_TIMESTAMP
       WHERE item_id = :itemId AND user_id = :winnerId AND bid_status = 'WINNING'`,
      { itemId, winnerId }
    );

    // 7. Update product status
    await connection.execute(
      `UPDATE products 
       SET status = 'SOLD', updated_at = CURRENT_TIMESTAMP
       WHERE item_id = :itemId`,
      { itemId }
    );

    // 8. Update auction winner payment status
    await connection.execute(
      `UPDATE auction_winners 
       SET payment_status = 'PAID', payment_date = CURRENT_TIMESTAMP
       WHERE item_id = :itemId`,
      { itemId }
    );

    // 9. Create notification (notification_id needs sequence)
    await connection.execute(
      `INSERT INTO notifications 
       (notification_id, user_id, type, title, message, item_id, created_at)
       VALUES (notification_seq.NEXTVAL, :userId, 'AUCTION_WON', 
               'Congratulations! You won the auction!', 
               'Payment of रु' || :amount || ' has been processed.', 
               :itemId, CURRENT_TIMESTAMP)`,
      { userId: winnerId, amount: winningAmount, itemId }
    );

    // 10. Release all other holds
    await connection.execute(
      `UPDATE wallet_holds wh
       SET status = 'RELEASED', released_at = CURRENT_TIMESTAMP
       WHERE wh.bid_id IN (
         SELECT bid_id FROM bids WHERE item_id = :itemId AND user_id != :winnerId
       ) AND wh.status = 'ACTIVE'`,
      { itemId, winnerId }
    );

    console.log(`✅ Auction ${itemId} completed. Winner: ${winnerId}, Amount: रु${winningAmount}`);

  } catch (error) {
    console.error('Error processing auction winner:', error);
    throw error;
  }
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
  console.log(` Server and Socket.IO running on port ${PORT}`);
  console.log(` Socket.IO endpoint: http://localhost:${PORT}`);
  
  // Process any missed auctions that ended while server was offline
  console.log(' Checking for missed ended auctions...');
  try {
    await checkEndingAuctions(io);
    console.log(' Missed auctions check completed');
  } catch (error) {
    console.error(' Error checking missed auctions:', error);
  }
});
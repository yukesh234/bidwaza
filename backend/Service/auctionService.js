import oracledb from 'oracledb';
import { getConnection } from '../Db/Db.js';

class AuctionService {
  // Track pending auto-bids to prevent duplicate triggers
  pendingAutoBids = new Map();

  // Place a bid with wallet validation and hold
  async placeBid(userId, itemId, bidAmount, io) {
    let connection;
    try {
      connection = await getConnection();
      await connection.execute('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

      // 1. Get product details and validate auction
      const productResult = await connection.execute(
        `SELECT p.*, u.first_name || ' ' || u.last_name as seller_name
         FROM products p
         JOIN users u ON p.seller_id = u.id
         WHERE p.item_id = :itemId`,
        { itemId }
      );

      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }

      const product = this.mapProduct(productResult.rows[0], productResult.metaData);
      const productType = product.product_type || product.PRODUCT_TYPE;
      
      if (!productType) {
        throw new Error('Product type is undefined');
      }
      
      if (!['AUCTION', 'REGISTRATION'].includes(productType)) {
        throw new Error(`This product is not available for bidding. Type: ${productType}`);
      }

      // Check auction timing
      const now = new Date();
      const startTime = new Date(product.start_time || product.START_TIME);
      const endTime = new Date(product.end_time || product.END_TIME);

      if (now < startTime) {
        throw new Error('Auction has not started yet');
      }

      if (now >= endTime) {
        throw new Error('Auction has already ended');
      }

      // 2. For REGISTRATION type, check if user is registered
      if (productType === 'REGISTRATION') {
        const regResult = await connection.execute(
          `SELECT registration_id FROM auction_registrations 
           WHERE item_id = :itemId AND user_id = :userId AND is_active = 'Y'`,
          { itemId, userId }
        );

        if (regResult.rows.length === 0) {
          throw new Error('You must register for this auction before bidding');
        }
      }

      // 3. Get current highest bid
      const currentBidResult = await connection.execute(
        `SELECT bid_amount, user_id FROM bids 
         WHERE item_id = :itemId AND bid_status = 'WINNING'
         ORDER BY bid_amount DESC FETCH FIRST 1 ROW ONLY`,
        { itemId }
      );

      const currentHighestBid = currentBidResult.rows.length > 0 
        ? currentBidResult.rows[0][0] 
        : (product.starting_price || product.STARTING_PRICE);

      const currentWinnerId = currentBidResult.rows.length > 0 
        ? currentBidResult.rows[0][1] 
        : null;

      // Validate bid amount
      if (bidAmount <= currentHighestBid) {
        throw new Error(`Bid must be higher than रु${currentHighestBid.toLocaleString()}`);
      }

      // Prevent seller from bidding
      const sellerId = product.seller_id || product.SELLER_ID;
      if (userId === sellerId) {
        throw new Error('You cannot bid on your own auction');
      }

      // 4. Check user's wallet balance
      const walletResult = await connection.execute(
        `SELECT wallet_id, balance FROM wallets WHERE user_id = :userId`,
        { userId }
      );

      if (walletResult.rows.length === 0) {
        throw new Error('Wallet not found. Please contact support to set up your wallet.');
      }

      const walletId = walletResult.rows[0][0];
      const walletBalance = walletResult.rows[0][1];

      const holdsResult = await connection.execute(
        `SELECT COALESCE(SUM(amount), 0) as total_holds 
         FROM wallet_holds 
         WHERE wallet_id = :walletId AND status = 'ACTIVE'`,
        { walletId }
      );

      const totalHolds = holdsResult.rows[0][0];
      const availableBalance = walletBalance - totalHolds;

      if (availableBalance < bidAmount) {
        throw new Error(`Insufficient wallet balance. Available: रु${availableBalance.toLocaleString()}`);
      }

      // 5. Release user's previous bid hold
      const prevBidResult = await connection.execute(
        `SELECT b.bid_id FROM bids b
         WHERE b.item_id = :itemId AND b.user_id = :userId 
         AND b.bid_status IN ('ACTIVE', 'WINNING', 'OUTBID')
         ORDER BY b.created_at DESC FETCH FIRST 1 ROW ONLY`,
        { itemId, userId }
      );

      if (prevBidResult.rows.length > 0) {
        const prevBidId = prevBidResult.rows[0][0];
        
        await connection.execute(
          `UPDATE wallet_holds 
           SET status = 'RELEASED', released_at = CURRENT_TIMESTAMP
           WHERE bid_id = :prevBidId AND status = 'ACTIVE'`,
          { prevBidId }
        );

        await connection.execute(
          `UPDATE bids SET bid_status = 'OUTBID', updated_at = CURRENT_TIMESTAMP
           WHERE bid_id = :prevBidId`,
          { prevBidId }
        );
      }

      // 6. Update previous winner's bid to OUTBID and release hold
      if (currentWinnerId && currentWinnerId !== userId) {
        await connection.execute(
          `UPDATE bids 
           SET bid_status = 'OUTBID', updated_at = CURRENT_TIMESTAMP
           WHERE item_id = :itemId AND user_id = :currentWinnerId AND bid_status = 'WINNING'`,
          { itemId, currentWinnerId }
        );

        await connection.execute(
          `UPDATE wallet_holds wh
           SET status = 'RELEASED', released_at = CURRENT_TIMESTAMP
           WHERE wh.bid_id IN (
             SELECT bid_id FROM bids 
             WHERE item_id = :itemId 
             AND user_id = :currentWinnerId 
             AND bid_status = 'OUTBID'
           ) AND wh.status = 'ACTIVE'`,
          { itemId, currentWinnerId }
        );

        await connection.execute(
          `INSERT INTO notifications 
           (notification_id, user_id, type, title, message, item_id, created_at)
           VALUES (notification_seq.NEXTVAL, :userId, 'BID_OUTBID', 
                   'You have been outbid!', 
                   'Someone placed a higher bid on ' || :productTitle, 
                   :itemId, CURRENT_TIMESTAMP)`,
          { userId: currentWinnerId, productTitle: product.title || product.TITLE, itemId }
        );

        if (io) {
          io.to(`user_${currentWinnerId}`).emit('outbid-notification', {
            itemId,
            productTitle: product.title || product.TITLE,
            newBidAmount: bidAmount,
          });
        }
      }

      // 7. Insert new bid
      const bidResult = await connection.execute(
        `INSERT INTO bids 
         (bid_id, item_id, user_id, bid_amount, bid_status, created_at, updated_at)
         VALUES (bid_seq.NEXTVAL, :itemId, :userId, :bidAmount, 'WINNING', 
                 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING bid_id INTO :bidId`,
        {
          itemId,
          userId,
          bidAmount,
          bidId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );

      const newBidId = bidResult.outBinds.bidId[0];

      // 8. Create wallet hold
      await connection.execute(
        `INSERT INTO wallet_holds 
         (hold_id, wallet_id, bid_id, amount, status, created_at)
         VALUES (hold_seq.NEXTVAL, :walletId, :bidId, :amount, 'ACTIVE', CURRENT_TIMESTAMP)`,
        { walletId, bidId: newBidId, amount: bidAmount }
      );

      // 9. Update product's current price
      await connection.execute(
        `UPDATE products 
         SET current_price = :bidAmount, updated_at = CURRENT_TIMESTAMP
         WHERE item_id = :itemId`,
        { bidAmount, itemId }
      );

      const bidderResult = await connection.execute(
        `SELECT first_name || ' ' || last_name as name, profile_picture_url 
         FROM users WHERE id = :userId`,
        { userId }
      );

      const bidderName = bidderResult.rows[0][0];

      await connection.commit();

      // 10. Broadcast bid update
      if (io) {
        io.to(`auction_${itemId}`).emit('bid-update', {
          itemId,
          bidAmount,
          bidderId: userId,
          bidderName,
          currentPrice: bidAmount,
          timestamp: new Date(),
        });
      }

      // 11. TRIGGER AUTO-BID CHECK (after successful bid)
      // Schedule auto-bid processing after 10 seconds
      this.scheduleAutoBidCheck(itemId, userId, bidAmount, io);

      return {
        success: true,
        message: 'Bid placed successfully!',
        data: {
          bidId: newBidId,
          bidAmount,
          currentPrice: bidAmount,
        }
      };

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Error placing bid:', error);
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  // Schedule auto-bid check with 10-second delay
  scheduleAutoBidCheck(itemId, triggeringUserId, currentBidAmount, io) {
    const key = `${itemId}`;
    
    // Clear any existing pending auto-bid for this item
    if (this.pendingAutoBids.has(key)) {
      clearTimeout(this.pendingAutoBids.get(key));
    }

    // Schedule new auto-bid check
    const timeoutId = setTimeout(async () => {
      try {
        await this.processAutoBids(itemId, triggeringUserId, currentBidAmount, io);
      } catch (error) {
        console.error('Error processing auto-bids:', error);
      } finally {
        this.pendingAutoBids.delete(key);
      }
    }, 10000); // 10 seconds delay

    this.pendingAutoBids.set(key, timeoutId);
    console.log(`⏰ Scheduled auto-bid check for item ${itemId} in 10 seconds`);
  }

  // Process auto-bids for an item
  async processAutoBids(itemId, triggeringUserId, triggeringBidAmount, io) {
    let connection;
    try {
      connection = await getConnection();

      // Get current winning bid
      const currentBidResult = await connection.execute(
        `SELECT b.bid_amount, b.user_id, u.first_name || ' ' || u.last_name as bidder_name
         FROM bids b
         JOIN users u ON b.user_id = u.id
         WHERE b.item_id = :itemId AND b.bid_status = 'WINNING'
         ORDER BY b.bid_amount DESC FETCH FIRST 1 ROW ONLY`,
        { itemId }
      );

      if (currentBidResult.rows.length === 0) {
        console.log(`No current winning bid for item ${itemId}`);
        return;
      }

      const currentBidAmount = currentBidResult.rows[0][0];
      const currentWinnerId = currentBidResult.rows[0][1];

      // Find all active auto-bids for this item (excluding current winner)
      const autoBidsResult = await connection.execute(
        `SELECT ab.auto_bid_id, ab.user_id, ab.max_bid_amount, ab.increment_amount,
                u.first_name || ' ' || u.last_name as user_name
         FROM auto_bids ab
         JOIN users u ON ab.user_id = u.id
         WHERE ab.item_id = :itemId 
         AND ab.is_active = 'Y'
         AND ab.user_id != :currentWinnerId
         AND ab.max_bid_amount > :currentBidAmount
         ORDER BY ab.max_bid_amount DESC`,
        { itemId, currentWinnerId, currentBidAmount }
      );

      if (autoBidsResult.rows.length === 0) {
        console.log(`No eligible auto-bids for item ${itemId}`);
        return;
      }

      // Get the highest auto-bid
      const [autoBidId, autoBidUserId, maxBidAmount, incrementAmount, userName] = autoBidsResult.rows[0];

      // Calculate next bid amount
      const nextBidAmount = currentBidAmount + incrementAmount;

      // Check if next bid exceeds max
      if (nextBidAmount > maxBidAmount) {
        console.log(`Auto-bid for user ${autoBidUserId} would exceed max (${maxBidAmount})`);
        
        // Deactivate this auto-bid
        await connection.execute(
          `UPDATE auto_bids 
           SET is_active = 'N', updated_at = CURRENT_TIMESTAMP
           WHERE auto_bid_id = :autoBidId`,
          { autoBidId }
        );
        await connection.commit();
        
        // Notify user their max was reached
        if (io) {
          io.to(`user_${autoBidUserId}`).emit('autobid-max-reached', {
            itemId,
            maxBidAmount,
            currentBidAmount
          });
        }
        
        return;
      }

      await connection.close();
      connection = null;

      // Place the auto-bid
      console.log(`🤖 AUTO-BID: User ${autoBidUserId} (${userName}) placing bid of रु${nextBidAmount}`);
      
      await this.placeBid(autoBidUserId, itemId, nextBidAmount, io);

      // Notify the user that auto-bid was placed
      if (io) {
        io.to(`user_${autoBidUserId}`).emit('autobid-placed', {
          itemId,
          bidAmount: nextBidAmount,
          remainingMax: maxBidAmount - nextBidAmount
        });
      }

    } catch (error) {
      console.error('Error processing auto-bids:', error);
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  // Create or update auto-bid
  async setAutoBid(userId, itemId, maxBidAmount, incrementAmount = 100) {
    let connection;
    try {
      connection = await getConnection();

      // Validate product exists and is an auction
      const productResult = await connection.execute(
        `SELECT product_type, current_price, starting_price, end_time, status
         FROM products WHERE item_id = :itemId`,
        { itemId }
      );

      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }

      const [productType, currentPrice, startingPrice, endTime, status] = productResult.rows[0];

      if (!['AUCTION', 'REGISTRATION'].includes(productType)) {
        throw new Error('Auto-bid is only available for auctions');
      }

      if (status !== 'ACTIVE') {
        throw new Error('Auction is not active');
      }

      if (new Date() >= new Date(endTime)) {
        throw new Error('Auction has ended');
      }

      const actualCurrentPrice = currentPrice || startingPrice;

      if (maxBidAmount <= actualCurrentPrice) {
        throw new Error(`Max bid must be higher than current price (रु${actualCurrentPrice})`);
      }

      // Check if auto-bid already exists
      const existingResult = await connection.execute(
        `SELECT auto_bid_id FROM auto_bids 
         WHERE user_id = :userId AND item_id = :itemId`,
        { userId, itemId }
      );

      if (existingResult.rows.length > 0) {
        // Update existing
        await connection.execute(
          `UPDATE auto_bids 
           SET max_bid_amount = :maxBidAmount, 
               increment_amount = :incrementAmount,
               is_active = 'Y',
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = :userId AND item_id = :itemId`,
          { maxBidAmount, incrementAmount, userId, itemId }
        );
      } else {
        // Create new
        await connection.execute(
          `INSERT INTO auto_bids 
           (auto_bid_id, user_id, item_id, max_bid_amount, increment_amount, is_active, created_at, updated_at)
           VALUES (autobid_seq.NEXTVAL, :userId, :itemId, :maxBidAmount, :incrementAmount, 'Y', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          { userId, itemId, maxBidAmount, incrementAmount }
        );
      }

      await connection.commit();

      return {
        success: true,
        message: 'Auto-bid configured successfully',
        data: { maxBidAmount, incrementAmount }
      };

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  // Cancel auto-bid
  async cancelAutoBid(userId, itemId) {
    let connection;
    try {
      connection = await getConnection();

      await connection.execute(
        `UPDATE auto_bids 
         SET is_active = 'N', updated_at = CURRENT_TIMESTAMP
         WHERE user_id = :userId AND item_id = :itemId`,
        { userId, itemId }
      );

      await connection.commit();

      return {
        success: true,
        message: 'Auto-bid cancelled'
      };

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  // Get user's auto-bid settings for an item
  async getAutoBid(userId, itemId) {
    let connection;
    try {
      connection = await getConnection();

      const result = await connection.execute(
        `SELECT auto_bid_id, max_bid_amount, increment_amount, is_active, created_at, updated_at
         FROM auto_bids
         WHERE user_id = :userId AND item_id = :itemId`,
        { userId, itemId }
      );

      if (result.rows.length === 0) {
        return {
          success: true,
          data: null
        };
      }

      const [autoBidId, maxBidAmount, incrementAmount, isActive, createdAt, updatedAt] = result.rows[0];

      return {
        success: true,
        data: {
          autoBidId,
          maxBidAmount,
          incrementAmount,
          isActive: isActive === 'Y',
          createdAt,
          updatedAt
        }
      };

    } catch (error) {
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  // Register for auction (existing method - unchanged)
  async registerForAuction(userId, itemId) {
    let connection;
    try {
      connection = await getConnection();

      const productResult = await connection.execute(
        `SELECT product_type, registration_end FROM products WHERE item_id = :itemId`,
        { itemId }
      );

      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }

      const productType = productResult.rows[0][0];
      const registrationEnd = new Date(productResult.rows[0][1]);

      if (productType !== 'REGISTRATION') {
        throw new Error('This auction does not require registration');
      }

      if (new Date() >= registrationEnd) {
        throw new Error('Registration period has ended');
      }

      const existingReg = await connection.execute(
        `SELECT registration_id FROM auction_registrations 
         WHERE item_id = :itemId AND user_id = :userId`,
        { itemId, userId }
      );

      if (existingReg.rows.length > 0) {
        throw new Error('You are already registered for this auction');
      }

      await connection.execute(
        `INSERT INTO auction_registrations 
         (registration_id, item_id, user_id, registered_at, is_active)
         VALUES (registration_seq.NEXTVAL, :itemId, :userId, CURRENT_TIMESTAMP, 'Y')`,
        { itemId, userId }
      );

      await connection.commit();

      return {
        success: true,
        message: 'Successfully registered for auction',
      };

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  // Get auction details (existing method - unchanged)
  async getAuctionDetails(itemId, userId = null) {
    let connection;
    try {
      connection = await getConnection();

      const productResult = await connection.execute(
        `SELECT p.ITEM_ID, p.SELLER_ID, p.TITLE, p.DESCRIPTION, p.CATEGORY, 
                p.STOCK, p.PRODUCT_TYPE, p.AMOUNT, p.STATUS, p.STARTING_PRICE, 
                p.CURRENT_PRICE, p.START_TIME, p.END_TIME, p.REGISTRATION_END,
                p.CREATED_AT, p.UPDATED_AT,
                u.FIRST_NAME || ' ' || u.LAST_NAME as SELLER_NAME,
                u.PROFILE_PICTURE_URL as SELLER_PICTURE,
                (SELECT COUNT(*) FROM bids WHERE item_id = p.item_id) as TOTAL_BIDS,
                (SELECT MAX(bid_amount) FROM bids WHERE item_id = p.item_id) as HIGHEST_BID
         FROM products p
         JOIN users u ON p.seller_id = u.id
         WHERE p.item_id = :itemId`,
        { itemId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }

      const productRow = productResult.rows[0];
      
      const imagesResult = await connection.execute(
        `SELECT IMAGE_URL, IS_PRIMARY, DISPLAY_ORDER 
         FROM product_images 
         WHERE ITEM_ID = :itemId 
         ORDER BY DISPLAY_ORDER, IS_PRIMARY DESC`,
        { itemId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const images = imagesResult.rows.map(img => ({
        url: img.IMAGE_URL,
        isPrimary: img.IS_PRIMARY === 'Y',
        displayOrder: img.DISPLAY_ORDER
      }));

      const product = {
        itemId: productRow.ITEM_ID,
        sellerId: productRow.SELLER_ID,
        title: productRow.TITLE,
        description: productRow.DESCRIPTION ? await productRow.DESCRIPTION.getData() : null,
        category: productRow.CATEGORY,
        stock: productRow.STOCK,
        productType: productRow.PRODUCT_TYPE,
        amount: productRow.AMOUNT,
        status: productRow.STATUS,
        startingPrice: productRow.STARTING_PRICE,
        currentPrice: productRow.CURRENT_PRICE,
        startTime: productRow.START_TIME ? productRow.START_TIME.toISOString() : null,
        endTime: productRow.END_TIME ? productRow.END_TIME.toISOString() : null,
        registrationEnd: productRow.REGISTRATION_END ? productRow.REGISTRATION_END.toISOString() : null,
        createdAt: productRow.CREATED_AT ? productRow.CREATED_AT.toISOString() : null,
        updatedAt: productRow.UPDATED_AT ? productRow.UPDATED_AT.toISOString() : null,
        sellerName: productRow.SELLER_NAME,
        sellerPicture: productRow.SELLER_PICTURE,
        totalBids: productRow.TOTAL_BIDS || 0,
        highestBid: productRow.HIGHEST_BID,
        images: images
      };

      const bidsResult = await connection.execute(
        `SELECT b.BID_ID, b.BID_AMOUNT, b.BID_STATUS, b.CREATED_AT,
                u.FIRST_NAME || ' ' || u.LAST_NAME as BIDDER_NAME,
                u.PROFILE_PICTURE_URL as BIDDER_PICTURE,
                CASE WHEN b.USER_ID = :userId THEN 'Y' ELSE 'N' END as IS_MY_BID
         FROM bids b
         JOIN users u ON b.user_id = u.id
         WHERE b.item_id = :itemId
         ORDER BY b.created_at DESC
         FETCH FIRST 10 ROWS ONLY`,
        { itemId, userId: userId || 0 },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const bidHistory = bidsResult.rows.map(row => ({
        bidId: row.BID_ID,
        bidAmount: row.BID_AMOUNT,
        bidStatus: row.BID_STATUS,
        createdAt: row.CREATED_AT ? row.CREATED_AT.toISOString() : null,
        bidderName: row.BIDDER_NAME,
        bidderPicture: row.BIDDER_PICTURE,
        isMyBid: row.IS_MY_BID === 'Y',
      }));

      let isRegistered = false;
      if (userId && product.productType === 'REGISTRATION') {
        const regResult = await connection.execute(
          `SELECT REGISTRATION_ID FROM auction_registrations 
           WHERE ITEM_ID = :itemId AND USER_ID = :userId AND IS_ACTIVE = 'Y'`,
          { itemId, userId },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        isRegistered = regResult.rows.length > 0;
      }

      let userBid = null;
      if (userId) {
        const userBidResult = await connection.execute(
          `SELECT BID_AMOUNT, BID_STATUS FROM bids 
           WHERE ITEM_ID = :itemId AND USER_ID = :userId
           ORDER BY CREATED_AT DESC 
           FETCH FIRST 1 ROW ONLY`,
          { itemId, userId },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (userBidResult.rows.length > 0) {
          userBid = {
            amount: userBidResult.rows[0].BID_AMOUNT,
            status: userBidResult.rows[0].BID_STATUS,
          };
        }
      }

      return {
        success: true,
        data: {
          product,
          bidHistory,
          isRegistered,
          userBid,
        }
      };

    } catch (error) {
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  mapProduct(row, metaData) {
    const obj = {};
    metaData.forEach((col, index) => {
      const upperKey = col.name.toUpperCase();
      const lowerKey = col.name.toLowerCase();
      obj[lowerKey] = row[index];
      obj[upperKey] = row[index];
    });
    return obj;
  }
}

export default new AuctionService();
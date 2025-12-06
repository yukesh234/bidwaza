import { getConnection } from '../Db/Db.js';
import {uploadImage,deleteImage} from '../Service/cloudinary.js';
import oracledb from 'oracledb';

async function addProduct(req, res) {
  let connection;
  try {
    console.log(req.body, req.user)
    const { title, description, category, stock, product_type, amount=0 } = req.body;

    // Validate required fields
    if ([title, description, category, product_type].some(f => !f?.trim()) || stock == null ) {
      return res.status(400).json({
        message: "All fields are required",
        success: false
      });
    }

    // Validate product type
    const validTypes = ['DIRECT_SELL', 'AUCTION', 'REGISTRATION'];
    if (!validTypes.includes(product_type)) {
      return res.status(400).json({
        message: "Invalid product type. Must be DIRECT_SELL, AUCTION, or REGISTRATION",
        success: false
      });
    }

    // Validate stock and amount
    if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      return res.status(400).json({
        message: "Stock must be a non-negative number",
        success: false
      });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <0) {
      return res.status(400).json({
        message: "Amount must be a positive number",
        success: false
      });
    }

    // Handle auction-specific fields
    let auctionData = null;
    if (product_type === 'AUCTION' || product_type === 'REGISTRATION') {
      const { starting_price, start_time, end_time, registration_end } = req.body;

      // Validate required auction fields
      if (!starting_price || !start_time || !end_time) {
        return res.status(400).json({
          message: "Starting price, start time (date & time), and end time (date & time) are required for auction products",
          success: false
        });
      }

      // Validate starting price
      if (isNaN(parseFloat(starting_price)) || parseFloat(starting_price) <= 0) {
        return res.status(400).json({
          message: "Starting price must be a positive number",
          success: false
        });
      }

      // Parse and validate datetime (handles both date and time)
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
      const now = new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          message: "Invalid datetime format for start time or end time. Please provide full date and time",
          success: false
        });
      }

      if (startDate < now) {
        return res.status(400).json({
          message: "Start time cannot be in the past",
          success: false
        });
      }

      if (endDate <= startDate) {
        return res.status(400).json({
          message: "End time must be after start time",
          success: false
        });
      }

      // Validate registration end ONLY for REGISTRATION type
      let regEndDate = null;
      if (product_type === 'REGISTRATION') {
        if (!registration_end) {
          return res.status(400).json({
            message: "Registration end time (date & time) is required for registration-type auctions",
            success: false
          });
        }

        regEndDate = new Date(registration_end);
        if (isNaN(regEndDate.getTime())) {
          return res.status(400).json({
            message: "Invalid datetime format for registration end time. Please provide full date and time",
            success: false
          });
        }

        if (regEndDate < now) {
          return res.status(400).json({
            message: "Registration end time cannot be in the past",
            success: false
          });
        }

        if (regEndDate >= startDate) {
          return res.status(400).json({
            message: "Registration must end before auction starts",
            success: false
          });
        }
      } else if (product_type === 'AUCTION' && registration_end) {
        // If AUCTION type has registration_end, ignore it or warn
        console.warn('Registration end time provided for AUCTION type - will be ignored');
      }

      auctionData = {
        starting_price: parseFloat(starting_price),
        start_time: startDate,
        end_time: endDate,
        registration_end: regEndDate
      };
    }

    // Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "At least one product image is required",
        success: false
      });
    }

    // Upload images to Cloudinary and extract URLs
    const uploadResults = await Promise.all(
      req.files.map(file => uploadImage(file?.path))
    );

    const productImagesURL = uploadResults.filter(url => url && typeof url === 'string');

    if (productImagesURL.length === 0) {
      throw new Error("No valid image URLs received from upload");
    }

    console.log('Valid image URLs:', productImagesURL);

    // Get DB connection
    connection = await getConnection();

    // Prepare SQL based on product type
    let insertSQL, insertBinds;

    if (product_type === 'DIRECT_SELL') {
      insertSQL = `INSERT INTO products (
         ITEM_ID, SELLER_ID, TITLE, DESCRIPTION, CATEGORY, STOCK, 
         PRODUCT_TYPE, AMOUNT, STATUS, CREATED_AT, UPDATED_AT
       ) VALUES (
         product_seq.NEXTVAL, :sellerId, :title, :description, :category, :stock, 
         :type, :amount, 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP
       ) RETURNING ITEM_ID INTO :itemId`;

      insertBinds = {
        sellerId: req.user.ID,
        title,
        description,
        category,
        stock: parseInt(stock),
        type: product_type,
        amount: parseFloat(amount),
        itemId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      };
    } else {
      // For AUCTION and REGISTRATION types
      insertSQL = `INSERT INTO products (
         ITEM_ID, SELLER_ID, TITLE, DESCRIPTION, CATEGORY, STOCK, 
         PRODUCT_TYPE, AMOUNT, STATUS, CREATED_AT, UPDATED_AT,
         STARTING_PRICE, CURRENT_PRICE, START_TIME, END_TIME, REGISTRATION_END
       ) VALUES (
         product_seq.NEXTVAL, :sellerId, :title, :description, :category, :stock, 
         :type, :amount, 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP,
         :startingPrice, :startingPrice, :startTime, :endTime, :registrationEnd
       ) RETURNING ITEM_ID INTO :itemId`;

      insertBinds = {
        sellerId: req.user.ID,
        title,
        description,
        category,
        stock: parseInt(stock),
        type: product_type,
        amount: parseFloat(amount),
        startingPrice: auctionData.starting_price,
        startTime: auctionData.start_time,
        endTime: auctionData.end_time,
        registrationEnd: auctionData.registration_end,
        itemId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      };
    }

    // Insert product
    const productResult = await connection.execute(insertSQL, insertBinds);
    const itemId = productResult.outBinds.itemId[0];

    // Insert images
    for (const i in productImagesURL) {
      await connection.execute(
        `INSERT INTO product_images (
           IMAGE_ID, ITEM_ID, IMAGE_URL, IS_PRIMARY, DISPLAY_ORDER
         ) VALUES (
           image_seq.NEXTVAL, :itemId, :url, :isPrimary, :displayOrder
         )`,
        {
          itemId,
          url: productImagesURL[i],
          isPrimary: i == 0 ? 'Y' : 'N',
          displayOrder: Number(i) + 1,
        },
        { autoCommit: false }
      );
    }

    // Commit transaction
    await connection.commit();

    // Prepare response data
    const responseData = {
      itemId,
      title,
      category,
      product_type,
      amount: parseFloat(amount),
      stock: parseInt(stock),
      images: productImagesURL
    };

    if (auctionData) {
      responseData.auction_details = {
        starting_price: auctionData.starting_price,
        current_price: auctionData.starting_price,
        start_time: auctionData.start_time,
        end_time: auctionData.end_time,
        ...(auctionData.registration_end && { registration_end: auctionData.registration_end })
      };
    }

    res.status(201).json({
      success: true,
      message: `${product_type === 'DIRECT_SELL' ? 'Product' : 'Auction'} listed successfully`,
      data: responseData
    });

  } catch (error) {
    console.error('Add product error:', error);
    
    // Rollback transaction on error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to list product", 
      error: error.message 
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Connection close error:', closeError);
      }
    }
  }
}


async function getSellerProducts(req, res) {
  let connection;
  try {
    const sellerId = req.user.ID;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const { category, product_type, includeDeleted } = req.query;
    
    const offset = (page - 1) * limit;

    connection = await getConnection();

    // Build dynamic WHERE clause - exclude soft-deleted products by default
    let whereClause = 'WHERE p.SELLER_ID = :sellerId';
    
    // Exclude soft-deleted products unless explicitly requested
    if (includeDeleted !== 'true') {
      whereClause += " AND p.STATUS != 'EXPIRED'";
    }
    
    const binds = { sellerId, offset, limit };

    // Add search filter
    if (search) {
      whereClause += ' AND (LOWER(p.TITLE) LIKE :search OR LOWER(TO_CHAR(p.DESCRIPTION)) LIKE :search)';
      binds.search = `%${search.toLowerCase()}%`;
    }

    // Add status filter
    if (status && status !== 'all') {
      whereClause += ' AND LOWER(p.STATUS) = :status';
      binds.status = status.toLowerCase();
    }

    if (category) {
      whereClause += ' AND p.CATEGORY = :category';
      binds.category = category;
    }

    if (product_type) {
      whereClause += ' AND p.PRODUCT_TYPE = :productType';
      binds.productType = product_type;
    }

    // Enhanced query with auction info
    const productsQuery = `
      SELECT 
        p.ITEM_ID,
        p.TITLE,
        TO_CHAR(p.DESCRIPTION) as DESCRIPTION,
        p.CATEGORY,
        p.STOCK,
        p.PRODUCT_TYPE,
        p.AMOUNT,
        p.STARTING_PRICE,
        p.CURRENT_PRICE,
        p.START_TIME,
        p.END_TIME,
        p.REGISTRATION_END,
        p.CREATED_AT,
        p.STATUS,
        aw.winning_bid as WINNING_BID,
        u.first_name || ' ' || u.last_name as WINNER_NAME,
        (SELECT COUNT(*) FROM bids WHERE item_id = p.ITEM_ID) as TOTAL_BIDS
      FROM products p
      LEFT JOIN auction_winners aw ON p.ITEM_ID = aw.item_id
      LEFT JOIN users u ON aw.user_id = u.id
      ${whereClause}
      ORDER BY p.CREATED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    // Count query - use same filters but without pagination
    const countBinds = { ...binds };
    delete countBinds.offset;
    delete countBinds.limit;

    const countQuery = `
      SELECT COUNT(DISTINCT p.ITEM_ID) as TOTAL_COUNT
      FROM products p
      LEFT JOIN auction_winners aw ON p.ITEM_ID = aw.item_id
      LEFT JOIN users u ON aw.user_id = u.id
      ${whereClause}
    `;

    const [productsResult, countResult] = await Promise.all([
      connection.execute(productsQuery, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      connection.execute(countQuery, countBinds, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    ]);

    const totalCount = countResult.rows[0]?.TOTAL_COUNT || 0;

    // Get images for each product
    const productsWithImages = await Promise.all(
      productsResult.rows.map(async (product) => {
        try {
          const imagesResult = await connection.execute(
            `SELECT IMAGE_URL, IS_PRIMARY, DISPLAY_ORDER 
             FROM product_images 
             WHERE ITEM_ID = :itemId 
             ORDER BY DISPLAY_ORDER`,
            { itemId: product.ITEM_ID },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );

          return {
            itemId: product.ITEM_ID,
            title: product.TITLE,
            description: product.DESCRIPTION,
            category: product.CATEGORY,
            stock: product.STOCK,
            productType: product.PRODUCT_TYPE,
            amount: product.AMOUNT,
            startingPrice: product.STARTING_PRICE,
            currentPrice: product.CURRENT_PRICE,
            startTime: product.START_TIME,
            endTime: product.END_TIME,
            registrationEnd: product.REGISTRATION_END,
            createdAt: product.CREATED_AT,
            status: product.STATUS,
            winningBid: product.WINNING_BID,
            winnerName: product.WINNER_NAME,
            totalBids: product.TOTAL_BIDS,
            images: imagesResult.rows.map(img => ({
              url: img.IMAGE_URL,
              isPrimary: img.IS_PRIMARY === 'Y',
              displayOrder: img.DISPLAY_ORDER
            }))
          };
        } catch (imageError) {
          console.error('Error fetching images for product:', product.ITEM_ID, imageError);
          return {
            itemId: product.ITEM_ID,
            title: product.TITLE,
            description: product.DESCRIPTION,
            category: product.CATEGORY,
            stock: product.STOCK,
            productType: product.PRODUCT_TYPE,
            amount: product.AMOUNT,
            startingPrice: product.STARTING_PRICE,
            currentPrice: product.CURRENT_PRICE,
            startTime: product.START_TIME,
            endTime: product.END_TIME,
            registrationEnd: product.REGISTRATION_END,
            createdAt: product.CREATED_AT,
            status: product.STATUS,
            winningBid: product.WINNING_BID,
            winnerName: product.WINNER_NAME,
            totalBids: product.TOTAL_BIDS,
            images: []
          };
        }
      })
    );

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Response structure with nested data (matches your current frontend)
    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: {
        products: productsWithImages,
        pagination: {
          currentPage: page,
          limit: limit,
          totalCount: totalCount,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch products", 
      error: error.message 
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Connection close error:', closeError);
      }
    }
  }
}

export async function getSellerOrders(req, res) {
  let connection;
  try {
    const sellerId = req.user.ID;

    connection = await getConnection();

    // Get all orders that contain seller's products
    const ordersResult = await connection.execute(
      `SELECT DISTINCT
        o.ORDER_ID,
        o.USER_ID,
        o.ORDER_NUMBER,
        o.TOTAL_AMOUNT,
        o.ORDER_STATUS,
        o.PAYMENT_STATUS,
        o.ESEWA_TXN_ID,
        o.ORDER_DATE,
        o.UPDATED_AT,
        u.FIRST_NAME || ' ' || u.LAST_NAME as BUYER_NAME,
        u.EMAIL as BUYER_EMAIL,
        u.PROFILE_PICTURE_URL as BUYER_PROFILE_PICTURE
      FROM orders o
      INNER JOIN order_items oi ON o.ORDER_ID = oi.ORDER_ID
      INNER JOIN users u ON o.USER_ID = u.ID
      WHERE oi.SELLER_ID = :sellerId
      ORDER BY o.ORDER_DATE DESC`,
      { sellerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (ordersResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No orders found",
        data: {
          orders: [],
          totalOrders: 0,
          totalRevenue: 0
        }
      });
    }

    // Get order items (only seller's items) with product details
    const ordersWithDetails = await Promise.all(
      ordersResult.rows.map(async (order) => {
        // Get only items that belong to this seller WITH REVIEWS
        const itemsResult = await connection.execute(
          `SELECT 
            oi.ORDER_ITEM_ID,
            oi.ITEM_ID,
            oi.PRODUCT_TITLE,
            oi.PRICE_AT_PURCHASE,
            oi.QUANTITY,
            oi.SUBTOTAL,
            oi.CREATED_AT,
            p.STATUS as PRODUCT_STATUS,
            p.STOCK as CURRENT_STOCK,
            r.REVIEW_ID,
            r.RATING,
            DBMS_LOB.SUBSTR(r.REVIEW_TEXT, 4000, 1) as REVIEW_TEXT,
            TO_CHAR(r.CREATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') as REVIEW_CREATED_AT,
            TO_CHAR(r.UPDATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') as REVIEW_UPDATED_AT
          FROM order_items oi
          LEFT JOIN products p ON oi.ITEM_ID = p.ITEM_ID
          LEFT JOIN ratings_reviews r ON oi.ORDER_ITEM_ID = r.ORDER_ITEM_ID
          WHERE oi.ORDER_ID = :orderId AND oi.SELLER_ID = :sellerId
          ORDER BY oi.CREATED_AT`,
          { orderId: order.ORDER_ID, sellerId },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Get images for each item
        const itemsWithImages = await Promise.all(
          itemsResult.rows.map(async (item) => {
            try {
              const imagesResult = await connection.execute(
                `SELECT IMAGE_URL, IS_PRIMARY
                 FROM product_images
                 WHERE ITEM_ID = :itemId
                 ORDER BY DISPLAY_ORDER`,
                { itemId: item.ITEM_ID },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
              );

              const primaryImage = imagesResult.rows.find(img => img.IS_PRIMARY === 'Y')?.IMAGE_URL ||
                                 imagesResult.rows[0]?.IMAGE_URL || null;

              return {
                orderItemId: item.ORDER_ITEM_ID,
                itemId: item.ITEM_ID,
                productTitle: item.PRODUCT_TITLE,
                priceAtPurchase: item.PRICE_AT_PURCHASE,
                quantity: item.QUANTITY,
                subtotal: item.SUBTOTAL,
                primaryImage: primaryImage,
                productStatus: item.PRODUCT_STATUS,
                currentStock: item.CURRENT_STOCK,
                review: item.REVIEW_ID ? {
                  reviewId: parseInt(item.REVIEW_ID),
                  rating: parseInt(item.RATING),
                  reviewText: item.REVIEW_TEXT ? (item.REVIEW_TEXT + '') : null,
                  createdAt: item.REVIEW_CREATED_AT ? item.REVIEW_CREATED_AT + '' : null,
                  updatedAt: item.REVIEW_UPDATED_AT ? item.REVIEW_UPDATED_AT + '' : null
                } : null
              };
            } catch (imageError) {
              console.error('Error fetching images for item:', item.ITEM_ID, imageError);
              return {
                orderItemId: item.ORDER_ITEM_ID,
                itemId: item.ITEM_ID,
                productTitle: item.PRODUCT_TITLE,
                priceAtPurchase: item.PRICE_AT_PURCHASE,
                quantity: item.QUANTITY,
                subtotal: item.SUBTOTAL,
                primaryImage: null,
                productStatus: item.PRODUCT_STATUS,
                currentStock: item.CURRENT_STOCK,
                review: item.REVIEW_ID ? {
                  reviewId: parseInt(item.REVIEW_ID),
                  rating: parseInt(item.RATING),
                  reviewText: item.REVIEW_TEXT ? (item.REVIEW_TEXT + '') : null,
                  createdAt: item.REVIEW_CREATED_AT ? item.REVIEW_CREATED_AT + '' : null,
                  updatedAt: item.REVIEW_UPDATED_AT ? item.REVIEW_UPDATED_AT + '' : null
                } : null
              };
            }
          })
        );

        // Calculate seller's revenue from this order (sum of their items only)
        const sellerRevenue = itemsWithImages.reduce((sum, item) => sum + item.subtotal, 0);

        return {
          orderId: order.ORDER_ID,
          orderNumber: order.ORDER_NUMBER,
          totalOrderAmount: order.TOTAL_AMOUNT,
          sellerRevenue: sellerRevenue,  // Only this seller's portion
          orderStatus: order.ORDER_STATUS,
          paymentStatus: order.PAYMENT_STATUS,
          esewaTxnId: order.ESEWA_TXN_ID,
          orderDate: order.ORDER_DATE,
          updatedAt: order.UPDATED_AT,
          buyer: {
            buyerId: order.USER_ID,
            name: order.BUYER_NAME,
            email: order.BUYER_EMAIL,
            profilePicture: order.BUYER_PROFILE_PICTURE
          },
          items: itemsWithImages,
          itemCount: itemsWithImages.length
        };
      })
    );

    // Calculate total revenue for seller
    const totalRevenue = ordersWithDetails.reduce((sum, order) => sum + order.sellerRevenue, 0);

    res.status(200).json({
      success: true,
      message: "Seller orders fetched successfully",
      data: {
        orders: ordersWithDetails,
        totalOrders: ordersWithDetails.length,
        totalRevenue: totalRevenue
      }
    });

  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch seller orders",
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Connection close error:', err);
      }
    }
  }
}

// Get single order details for seller
export async function getProductById(req, res) {
  const { ItemId } = req.params;  // or const ItemId = req.params.ItemId;
  let connection;
  try {
    if (!ItemId) {
      return res.status(400).json({ 
        success: false,
        message: "Item id is required" 
      });
    }

    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT 
         p.ITEM_ID,
         p.SELLER_ID,
         p.TITLE,
         TO_CHAR(p.DESCRIPTION) AS DESCRIPTION,  -- FIXED: Added TO_CHAR for CLOB
         p.CATEGORY,
         p.STOCK,
         p.PRODUCT_TYPE,
         p.AMOUNT,
         p.CREATED_AT,
         u.FIRST_NAME || ' ' || u.LAST_NAME AS SELLER_NAME,
         u.EMAIL AS SELLER_EMAIL,
         u.PROFILE_PICTURE_URL AS SELLER_PROFILE_PICTURE
       FROM products p
       LEFT JOIN users u ON p.SELLER_ID = u.ID
       WHERE p.ITEM_ID = :itemId
         AND p.STATUS = 'ACTIVE'`,
      { itemId: ItemId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }

    const product = result.rows[0];

    // Fetch product images
    const imagesResult = await connection.execute(
      `SELECT IMAGE_URL, IS_PRIMARY, DISPLAY_ORDER 
       FROM product_images 
       WHERE ITEM_ID = :itemId 
       ORDER BY DISPLAY_ORDER`,
      { itemId: ItemId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const images = imagesResult.rows.map((img) => ({
      url: img.IMAGE_URL,
      isPrimary: img.IS_PRIMARY === "Y",
      displayOrder: img.DISPLAY_ORDER,
    }));

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: {
        itemId: product.ITEM_ID,
        title: product.TITLE,
        description: product.DESCRIPTION,
        category: product.CATEGORY,
        stock: product.STOCK,
        productType: product.PRODUCT_TYPE,
        amount: product.AMOUNT,
        createdAt: product.CREATED_AT,
        seller: {
          sellerId: product.SELLER_ID,
          name: product.SELLER_NAME,
          email: product.SELLER_EMAIL,
          profilePicture: product.SELLER_PROFILE_PICTURE
        },
        images
      }
    });

  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Connection close error:", closeError);
      }
    }
  }
}
export async function updateOrderStatus(req, res)
{
  const { orderId, orderStatus } = req.body;
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `update orders set order_status = :orderstatus where order_id = :orderId`,
      { orderstatus: orderStatus, orderId},
      {autoCommit: true}
    )
    if(result.rowsAffected === 1)
    {
      res.status(200).json({
        success: true,
        message: "Order status updated successfully"
      });
    }
    else{
      res.status(404).json({
        success: false,
        message: "Order not found"
      });
    } 
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message
    });
  }
}


export async function updateStock(req, res) {
  const { newstock, item_id } = req.body;
  const sellerId = req.user.ID; // Get seller from auth token
  let connection;
  
  try {
    // Validate inputs first (before connecting to DB)
    if (!item_id) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required"
      });
    }

    if (newstock == null || newstock < 0) { // Allow 0 stock (out of stock)
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative or null"
      });
    }

    connection = await getConnection();

    // IMPORTANT: Verify this product belongs to the seller
    const checkOwnership = await connection.execute(
      `SELECT SELLER_ID FROM products WHERE ITEM_ID = :item_id`,
      { item_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (checkOwnership.rows[0].SELLER_ID !== sellerId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this product"
      });
    }

    // Update stock
    const result = await connection.execute(
      `UPDATE products SET STOCK = :newstock, UPDATED_AT = CURRENT_TIMESTAMP 
       WHERE ITEM_ID = :item_id`,  // FIXED: Removed space in :item_id
      { newstock, item_id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 1) {
      res.status(200).json({
        success: true,
        message: "Stock updated successfully",
        data: {
          itemId: item_id,
          newStock: newstock
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update stock",
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Connection close error:', err);
      }
    }
  }
}

export async function updateStatus(req, res) {
  console.log("body", req.body)
  const { listingId, newStatus } = req.body;
  const sellerId = req.user.ID; // from auth
  let connection;

  try {
    if (!listingId || !newStatus) {
      return res.status(400).json({
        success: false,
        message: "listingId and newStatus are required"
      });
    }

    connection = await getConnection();

    // 1️⃣ Check ownership
    const checkOwnership = await connection.execute(
      `SELECT SELLER_ID FROM products WHERE ITEM_ID = :item_id`,
      { item_id: listingId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (checkOwnership.rows[0].SELLER_ID !== sellerId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this product"
      });
    }

    // 2️⃣ Perform update
    const result = await connection.execute(
      `UPDATE products SET status = :newStatus WHERE item_id = :item_id`,
      { newStatus, item_id: listingId },
      { autoCommit: true }
    );

    // 3️⃣ Check result
    if (result.rowsAffected === 1) {
      return res.status(200).json({
        success: true,
        message: "Status updated successfully",
        data: {
          itemId: listingId,
          newStatus
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
}

export async function sellerstats(req, res) {
  const userId = req.user.ID;
  let connection;
  try {
    connection = await getConnection();
    
    // Query 1: Total Listings
    const totalListings = await connection.execute(
      `SELECT COUNT(*) AS totalListings 
       FROM products 
       WHERE seller_id = :userId`,
      [userId]
    );
    
    // Query 2: Active Auctions
    const activeAuctions = await connection.execute(
      `SELECT COUNT(*) AS activeAuctions 
       FROM products 
       WHERE seller_id = :userId AND status = 'ACTIVE'`,
      [userId]
    );
    
    // Query 3: Sold Items
    const soldItems = await connection.execute(
      `SELECT COUNT(DISTINCT oi.item_id) AS soldItems 
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       WHERE oi.seller_id = :userId AND o.order_status = 'COMPLETED'`,
      [userId]
    );
    
    // Query 4: Total Earnings
    const totalEarnings = await connection.execute(
      `SELECT NVL(SUM(oi.subtotal), 0) AS totalEarnings
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       WHERE oi.seller_id = :userId AND o.order_status = 'COMPLETED'`,
      [userId]
    );
    
    // Query 5: Average Sale Price
    const avgSalePrice = await connection.execute(
      `SELECT NVL(AVG(oi.price_at_purchase), 0) AS avgSalePrice
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       WHERE oi.seller_id = :userId AND o.order_status = 'COMPLETED'`,
      [userId]
    );
    
    // Query 6: Success Rate
    const successRate = await connection.execute(
      `SELECT 
         CASE 
           WHEN COUNT(*) = 0 THEN 0 
           ELSE ROUND((SUM(CASE WHEN o.order_status = 'COMPLETED' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2)
         END AS successRate
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       WHERE oi.seller_id = :userId`,
      [userId]
    );
    
    // Query 7: Seller Average Rating and Review Count
    const sellerRating = await connection.execute(
      `SELECT 
         ROUND(AVG(rr.RATING), 1) AS avgRating,
         COUNT(rr.REVIEW_ID) AS reviewCount
       FROM ratings_reviews rr
       JOIN products p ON rr.PRODUCT_ID = p.ITEM_ID
       WHERE p.SELLER_ID = :userId`,
      [userId]
    );
    
    // Extract values - data is in array format [ [ value ] ]
    const stats = {
      totalListings: totalListings.rows[0]?.[0] || 0,
      activeAuctions: activeAuctions.rows[0]?.[0] || 0,
      soldItems: soldItems.rows[0]?.[0] || 0,
      totalEarnings: totalEarnings.rows[0]?.[0] || 0,
      avgSalePrice: avgSalePrice.rows[0]?.[0] || 0,
      successRate: successRate.rows[0]?.[0] || 0,
      rating: {
        average: sellerRating.rows[0]?.[0] || 0,
        count: sellerRating.rows[0]?.[1] || 0
      }
    };
    
    res.json({
      success: true,
      message: "Seller statistics fetched successfully",
      data: stats
    });
    
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching seller statistics",
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Error closing DB connection:", closeErr);
      }
    }
  }
}

export async function editProduct(req, res) {
  let connection;
  try {
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    connection = await getConnection();
    const { ProductId } = req.params;
    const userId = req.user.ID;
    
    // Parse body data
    let formData = req.body.formData;
    let deletedImageUrls = req.body.deletedImageUrls || [];

    if (typeof formData === 'string') {
      formData = JSON.parse(formData);
    }
    if (typeof deletedImageUrls === 'string') {
      deletedImageUrls = JSON.parse(deletedImageUrls);
    }

    const newFiles = req.files || [];

    // Validation
    if (!ProductId) {
      return res.status(400).json({
        success: false,
        message: "ProductId is required"
      });
    }

    if (!formData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form data'
      });
    }

    // Validate required fields
    if (!formData.title?.trim() || !formData.description?.trim() || 
        !formData.category || !formData.product_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, category, product_type'
      });
    }

    // Check product ownership and status
    const ownerCheckQuery = `
      SELECT SELLER_ID, PRODUCT_TYPE, STATUS FROM PRODUCTS WHERE ITEM_ID = :itemId
    `;
    
    const ownerCheckResult = await connection.execute(ownerCheckQuery, [ProductId]);
    
    if (ownerCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const [product] = ownerCheckResult.rows;
    const [sellerId, productType, status] = product;

    if (sellerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own products'
      });
    }

    if (status === 'SOLD' || status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit completed or sold products'
      });
    }

    // Step 1: Delete images from Cloudinary and database
    if (deletedImageUrls && deletedImageUrls.length > 0) {
      for (const url of deletedImageUrls) {
        try {
          await deleteImage(url);
        } catch (err) {
          console.error(`Failed to delete image ${url}:`, err);
        }
      }

      if (deletedImageUrls.length > 0) {
        const placeholders = deletedImageUrls.map((_, i) => `:url${i}`).join(',');
        const deleteImagesQuery = `
          DELETE FROM PRODUCT_IMAGES 
          WHERE ITEM_ID = :itemId AND IMAGE_URL IN (${placeholders})
        `;

        const deleteParams = { itemId: ProductId };
        deletedImageUrls.forEach((url, i) => {
          deleteParams[`url${i}`] = url;
        });

        await connection.execute(deleteImagesQuery, deleteParams);
      }
    }

    // Step 2: Upload new images to Cloudinary
    const uploadedImageUrls = [];
    if (newFiles && newFiles.length > 0) {
      // Upload images using the same method as addProduct
      const uploadResults = await Promise.all(
        newFiles.map(file => uploadImage(file?.path))
      );

      const validUrls = uploadResults.filter(url => url && typeof url === 'string');
      uploadedImageUrls.push(...validUrls);

      if (validUrls.length > 0) {
        console.log('Uploaded image URLs:', validUrls);
      }
    }

    // Step 3: Insert new images into database
    if (uploadedImageUrls.length > 0) {
      // Get max display order
      const getMaxOrderQuery = `
        SELECT NVL(MAX(DISPLAY_ORDER), 0) as maxOrder FROM PRODUCT_IMAGES WHERE ITEM_ID = :itemId
      `;
      
      const orderResult = await connection.execute(getMaxOrderQuery, [ProductId]);
      let displayOrder = (orderResult.rows[0]?.[0] || 0) + 1;

      // Insert each image - FIXED: Use image_seq instead of product_images_seq
      for (const imageUrl of uploadedImageUrls) {
        const insertImageQuery = `
          INSERT INTO PRODUCT_IMAGES (IMAGE_ID, ITEM_ID, IMAGE_URL, DISPLAY_ORDER, IS_PRIMARY)
          VALUES (image_seq.NEXTVAL, :itemId, :imageUrl, :displayOrder, 'N')
        `;

        await connection.execute(insertImageQuery, {
          itemId: ProductId,
          imageUrl: imageUrl,
          displayOrder: displayOrder++
        }, { autoCommit: false });
      }
    }

    // Step 4: Update product fields
    const updateFields = [];
    const updateParams = { itemId: ProductId };

    if (formData.title !== undefined) {
      updateFields.push('TITLE = :title');
      updateParams.title = formData.title.trim();
    }
    if (formData.description !== undefined) {
      updateFields.push('DESCRIPTION = :description');
      updateParams.description = formData.description.trim();
    }
    if (formData.category !== undefined) {
      updateFields.push('CATEGORY = :category');
      updateParams.category = formData.category;
    }
    if (formData.stock !== undefined) {
      updateFields.push('STOCK = :stock');
      updateParams.stock = parseInt(formData.stock) || 1;
    }
    if (formData.amount !== undefined) {
      updateFields.push('AMOUNT = :amount');
      updateParams.amount = parseFloat(formData.amount) || 0;
    }
    if (formData.starting_price !== undefined && formData.starting_price !== '') {
      updateFields.push('STARTING_PRICE = :startingPrice');
      updateParams.startingPrice = parseFloat(formData.starting_price);
    }
    if (formData.start_time !== undefined && formData.start_time !== '') {
      updateFields.push('START_TIME = TO_TIMESTAMP(:startTime, \'YYYY-MM-DD"T"HH24:MI:SS\')');
      updateParams.startTime = formData.start_time;
    }
    if (formData.end_time !== undefined && formData.end_time !== '') {
      updateFields.push('END_TIME = TO_TIMESTAMP(:endTime, \'YYYY-MM-DD"T"HH24:MI:SS\')');
      updateParams.endTime = formData.end_time;
    }
    if (formData.registration_end !== undefined && formData.registration_end !== '') {
      updateFields.push('REGISTRATION_END = TO_TIMESTAMP(:registrationEnd, \'YYYY-MM-DD"T"HH24:MI:SS\')');
      updateParams.registrationEnd = formData.registration_end;
    }

    // Always update UPDATED_AT
    updateFields.push('UPDATED_AT = SYSTIMESTAMP');

    if (updateFields.length === 1) { // Only UPDATED_AT
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const updateQuery = `UPDATE PRODUCTS SET ${updateFields.join(', ')} WHERE ITEM_ID = :itemId`;
    const updateResult = await connection.execute(updateQuery, updateParams, { autoCommit: false });

    if (updateResult.rowsAffected === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update product'
      });
    }

    // Commit all changes
    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        productId: ProductId,
        uploadedImages: uploadedImageUrls.length,
        deletedImages: deletedImageUrls.length,
        updatedFields: updateFields.length - 1
      }
    });

  } catch (error) {
    // Rollback on error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr);
      }
    }

    console.error('Edit product error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product'
    });

  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Connection close error:', closeErr);
      }
    }
  }
}

// export async function deleteProduct(req, res) {
//   let connection;
//   try {
//     const { productId } = req.params;
//     const userId = req.user.ID;
    
//     if (!productId) {
//       return res.status(400).json({
//         success: false,
//         message: "ProductId is required",
//       });
//     }
    
//     connection = await getConnection();
    
//     // First, verify the product exists and belongs to the seller
//     const verifyQuery = `
//       SELECT ITEM_ID, STATUS, SELLER_ID 
//       FROM products 
//       WHERE ITEM_ID = :productId
//     `;

//     const verifyResult = await connection.execute(
//       verifyQuery,
//       { productId },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     // Check if product exists
//     if (verifyResult.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found"
//       });
//     }

//     const product = verifyResult.rows[0];

//     // Check if the product belongs to the seller (FIXED: changed sellerId to userId)
//     if (product.SELLER_ID !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to delete this product"
//       });
//     }

//     // Check if already deleted
//     if (product.STATUS === 'EXPIRED') {
//       return res.status(400).json({
//         success: false,
//         message: "Product is already deleted"
//       });
//     }
    
//     // Perform soft delete
//     const deleteQuery = `
//       UPDATE products 
//       SET STATUS = 'EXPIRED',
//           UPDATED_AT = SYSTIMESTAMP
//       WHERE ITEM_ID = :productId
//     `;

//     const deleteResult = await connection.execute(
//       deleteQuery,
//       { productId },
//       { autoCommit: true }
//     );

//     // Check if update was successful
//     if (deleteResult.rowsAffected === 0) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to delete product"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Product deleted successfully",
//       data: {
//         productId: parseInt(productId)
//       }
//     });
    
//   } catch (error) {
//     console.error('Delete product error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete product",
//       error: error.message
//     });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (closeError) {
//         console.error('Connection close error:', closeError);
//       }
//     }
//   }
// }

export async function deleteProduct(req, res) {
  let connection;
  try {
    const { productId } = req.params;
    const userId = req.user.ID;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "ProductId is required",
      });
    }
    
    connection = await getConnection();
    
    // First, verify the product exists and belongs to the seller
    const verifyQuery = `
      SELECT ITEM_ID, STATUS, SELLER_ID 
      FROM products 
      WHERE ITEM_ID = :productId
    `;

    const verifyResult = await connection.execute(
      verifyQuery,
      { productId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Check if product exists
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const product = verifyResult.rows[0];

    // Check if the product belongs to the seller
    if (product.SELLER_ID !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this product"
      });
    }

    // Check if already deleted
    if (product.STATUS === 'EXPIRED') {
      return res.status(400).json({
        success: false,
        message: "Product is already deleted"
      });
    }
    
    // Perform soft delete and remove from all carts in a transaction
    const deleteQuery = `
      UPDATE products 
      SET STATUS = 'EXPIRED',
          UPDATED_AT = SYSTIMESTAMP
      WHERE ITEM_ID = :productId
    `;

    const deleteFromCartsQuery = `
      DELETE FROM cart_items
      WHERE ITEM_ID = :productId
    `;

    // Execute both queries
    const deleteResult = await connection.execute(
      deleteQuery,
      { productId },
      { autoCommit: false } // Don't auto-commit yet
    );

    // Remove product from all user carts
    const cartDeleteResult = await connection.execute(
      deleteFromCartsQuery,
      { productId },
      { autoCommit: false }
    );

    // Commit the transaction
    await connection.commit();

    // Check if update was successful
    if (deleteResult.rowsAffected === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete product"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: {
        productId: parseInt(productId),
        removedFromCarts: cartDeleteResult.rowsAffected || 0
      }
    });
    
  } catch (error) {
    // Rollback on error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Connection close error:', closeError);
      }
    }
  }
}











export { addProduct, getSellerProducts };
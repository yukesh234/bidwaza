import { getConnection } from '../Db/Db.js';
import {uploadImage} from '../Service/cloudinary.js';
import oracledb from 'oracledb';

async function addProduct(req, res) {
  let connection;
  try {
    const { title, description, category, stock, product_type, amount } = req.body;

    // Validate required fields
    if ([title, description, category, product_type].some(f => !f?.trim()) || stock == null || amount == null) {
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

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
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
         :type, :amount, 'PENDING', SYSTIMESTAMP, SYSTIMESTAMP,
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
    
    // Get pagination and filter params from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { category, product_type } = req.query;
    
    // Calculate offset
    const offset = (page - 1) * limit;

    connection = await getConnection();

    // Build dynamic WHERE clause for filters
    let whereClause = 'WHERE SELLER_ID = :sellerId';
    const binds = { sellerId, offset, limit };

    if (category) {
      whereClause += ' AND CATEGORY = :category';
      binds.category = category;
    }

    if (product_type) {
      whereClause += ' AND PRODUCT_TYPE = :productType';
      binds.productType = product_type;
    }

    // Main query with pagination
    const productsQuery = `
      SELECT 
        ITEM_ID,
        TITLE,
        TO_CHAR(DESCRIPTION) as DESCRIPTION,
        CATEGORY,
        STOCK,
        PRODUCT_TYPE,
        AMOUNT,
        CREATED_AT,
        STATUS
      FROM products 
      ${whereClause}
      ORDER BY CREATED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    // Count query for total records
    const countQuery = `
      SELECT COUNT(*) as TOTAL_COUNT
      FROM products 
      ${whereClause}
    `;

    // Execute both queries in parallel
    const [productsResult, countResult] = await Promise.all([
      connection.execute(productsQuery, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      connection.execute(countQuery, 
        { sellerId, ...(category && { category }), ...(product_type && { productType: product_type }) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )
    ]);

    const totalCount = countResult.rows[0]?.TOTAL_COUNT || 0;

    console.log('=== PAGINATION INFO ===');
    console.log('Page:', page);
    console.log('Limit:', limit);
    console.log('Offset:', offset);
    console.log('Total Count:', totalCount);
    console.log('Rows returned:', productsResult.rows.length);

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
            createdAt: product.CREATED_AT,
            status: product.STATUS,
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
            createdAt: product.CREATED_AT,
            images: []
          };
        }
      })
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

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
        // Get only items that belong to this seller
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
            p.STOCK as CURRENT_STOCK
          FROM order_items oi
          LEFT JOIN products p ON oi.ITEM_ID = p.ITEM_ID
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
                currentStock: item.CURRENT_STOCK
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
                currentStock: item.CURRENT_STOCK
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
export async function getSellerOrderById(req, res) {
  let connection;
  try {
    const sellerId = req.user.ID;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    connection = await getConnection();

    // Check if seller has items in this order
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as ITEM_COUNT
       FROM order_items
       WHERE ORDER_ID = :orderId AND SELLER_ID = :sellerId`,
      { orderId, sellerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (checkResult.rows[0].ITEM_COUNT === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or doesn't contain your products"
      });
    }

    // Get order details
    const orderResult = await connection.execute(
      `SELECT 
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
      INNER JOIN users u ON o.USER_ID = u.ID
      WHERE o.ORDER_ID = :orderId`,
      { orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = orderResult.rows[0];

    // Get only seller's items from this order
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
        p.STOCK as CURRENT_STOCK
      FROM order_items oi
      LEFT JOIN products p ON oi.ITEM_ID = p.ITEM_ID
      WHERE oi.ORDER_ID = :orderId AND oi.SELLER_ID = :sellerId
      ORDER BY oi.CREATED_AT`,
      { orderId, sellerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Get images for each item
    const itemsWithImages = await Promise.all(
      itemsResult.rows.map(async (item) => {
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
          currentStock: item.CURRENT_STOCK
        };
      })
    );

    const sellerRevenue = itemsWithImages.reduce((sum, item) => sum + item.subtotal, 0);

    res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: {
        orderId: order.ORDER_ID,
        orderNumber: order.ORDER_NUMBER,
        totalOrderAmount: order.TOTAL_AMOUNT,
        sellerRevenue: sellerRevenue,
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
      }
    });

  } catch (error) {
    console.error('Get seller order by ID error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
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

export { addProduct, getSellerProducts };
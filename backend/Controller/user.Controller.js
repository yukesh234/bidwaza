import fs from "fs";
import {uploadImage,deleteImage} from "../Service/cloudinary.js";
import { getConnection } from "../Db/Db.js";
import oracledb from "oracledb";
import jwt from 'jsonwebtoken'



export async function uploadProfile(req, res) {
  try {
    const userid  = req.user.ID;

    if (!req.file) {
      return res.status(400).json({ message: "File not found" });
    }

    const filePath = req.file.path;
    const response = await uploadImage(filePath);
    const imageUrl = response.secure_url;

    const connection = await getConnection();
    await connection.execute(
      `UPDATE users 
       SET profile_picture_url = :url 
       WHERE id = :id`,
      { url: imageUrl, id: userid },
      { autoCommit: true }
    );

    // delete local temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true, url: imageUrl });

  } catch (error) {
    console.error("Upload PFP error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Profile picture upload failed" });
  }
}

export async function editprofile(req, res) {
  let connection;
  try {
    const userId = req.user.ID;

    if (!req.file) {
      return res.status(400).json({ message: "File not found" });
    }

    connection = await getConnection();

    // Get old profile picture (if exists)
    const olderpfpResult = await connection.execute(
      `SELECT profile_picture_url FROM users WHERE id = :id`,
      { id: userId }
    );
    const olderpfp =
      olderpfpResult.rows.length > 0 ? olderpfpResult.rows[0][0] : null;

    // Upload new picture
    const filepath = req.file.path;
    const newpfpUrl = await uploadImage(filepath); // returns secure_url

    // Update user profile with new picture
    await connection.execute(
      `UPDATE users 
       SET profile_picture_url = :url,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      { url: newpfpUrl, id: userId },
      { autoCommit: true }
    );

    // Delete old picture from Cloudinary (optional)
    if (olderpfp) {
      await deleteImage(olderpfp);
    }

    res.json({ success: true, url: newpfpUrl });
  } catch (error) {
    console.error("Upload PFP error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: "Profile picture upload failed" });
  } finally {
    if (connection) await connection.close();
  }
}

export async function getallProducts(req, res) {
  let connection;
  let userId = null;

  // 🔹 Get user ID from token if present
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }
  } catch {
    // No valid token, continue
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const offset = (page - 1) * limit;

    const { category, product_type } = req.query;

    connection = await getConnection();

    // 🔹 Build dynamic WHERE clause
    let whereClause = " WHERE p.STATUS = 'ACTIVE'";
    const binds = { offset, limit };

    if (category) {
      whereClause += " AND p.CATEGORY = :category";
      binds.category = category;
    }

    if (product_type) {
      whereClause += " AND p.PRODUCT_TYPE = :productType";
      binds.productType = product_type;
    }

    if (userId) {
      whereClause += " AND p.SELLER_ID != :userId";
      binds.userId = userId;
    }

    // 🔹 Products query with OFFSET/FETCH - NOW INCLUDES AUCTION FIELDS
    const productsQuery = `
      SELECT 
        p.ITEM_ID,
        p.SELLER_ID,
        p.TITLE,
        TO_CHAR(p.DESCRIPTION) AS DESCRIPTION,
        p.CATEGORY,
        p.STOCK,
        p.PRODUCT_TYPE,
        p.AMOUNT,
        p.CREATED_AT,
        p.STARTING_PRICE,
        p.CURRENT_PRICE,
        p.START_TIME,
        p.END_TIME,
        p.REGISTRATION_END,
        u.FIRST_NAME || ' ' || u.LAST_NAME AS SELLER_NAME,
        u.EMAIL AS SELLER_EMAIL,
        u.PROFILE_PICTURE_URL AS SELLER_PROFILE_PICTURE
      FROM products p
      LEFT JOIN users u ON p.SELLER_ID = u.ID
      ${whereClause}
      ORDER BY p.CREATED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    // 🔹 Count total products
    const countQuery = `
      SELECT COUNT(*) AS TOTAL_COUNT
      FROM products p
      ${whereClause}
    `;
    const countBinds = { ...binds };
    delete countBinds.offset;
    delete countBinds.limit;

    // 🔹 Execute queries in parallel
    const [productsResult, countResult] = await Promise.all([
      connection.execute(productsQuery, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      connection.execute(countQuery, countBinds, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
    ]);

    const totalCount = countResult.rows[0]?.TOTAL_COUNT || 0;

    // 🔹 Fetch product images
    const productsWithImages = await Promise.all(
      productsResult.rows.map(async (product) => {
        const imagesResult = await connection.execute(
          `SELECT IMAGE_URL, IS_PRIMARY, DISPLAY_ORDER
           FROM product_images
           WHERE ITEM_ID = :itemId
           ORDER BY DISPLAY_ORDER`,
          { itemId: product.ITEM_ID },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const productData = {
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
            profilePicture: product.SELLER_PROFILE_PICTURE,
          },
          images: imagesResult.rows.map((img) => ({
            url: img.IMAGE_URL,
            isPrimary: img.IS_PRIMARY === 'Y',
            displayOrder: img.DISPLAY_ORDER,
          })),
        };

        // 🔹 Add auction details for AUCTION and REGISTRATION types
        if (product.PRODUCT_TYPE === 'AUCTION' || product.PRODUCT_TYPE === 'REGISTRATION') {
          productData.auctionDetails = {
            startingPrice: product.STARTING_PRICE,
            currentPrice: product.CURRENT_PRICE,
            startTime: product.START_TIME,
            endTime: product.END_TIME,
          };

          // Only include registration_end for REGISTRATION type
          if (product.PRODUCT_TYPE === 'REGISTRATION' && product.REGISTRATION_END) {
            productData.auctionDetails.registrationEnd = product.REGISTRATION_END;
          }

          // 🔹 Calculate auction status
          const now = new Date();
          const startTime = new Date(product.START_TIME);
          const endTime = new Date(product.END_TIME);
          const regEnd = product.REGISTRATION_END ? new Date(product.REGISTRATION_END) : null;

          if (product.PRODUCT_TYPE === 'REGISTRATION' && regEnd) {
            if (now < regEnd) {
              productData.auctionDetails.status = 'REGISTRATION_OPEN';
            } else if (now < startTime) {
              productData.auctionDetails.status = 'REGISTRATION_CLOSED';
            } else if (now >= startTime && now < endTime) {
              productData.auctionDetails.status = 'LIVE';
            } else {
              productData.auctionDetails.status = 'ENDED';
            }
          } else {
            // Standard AUCTION type
            if (now < startTime) {
              productData.auctionDetails.status = 'UPCOMING';
            } else if (now >= startTime && now < endTime) {
              productData.auctionDetails.status = 'LIVE';
            } else {
              productData.auctionDetails.status = 'ENDED';
            }
          }
        }

        return productData;
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

   

    // 🔹 Send response
    res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: {
        products: productsWithImages,
        pagination: {
          currentPage: page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
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

export async function getProductById(req, res) {
  const { ItemId } = req.params;
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
         TO_CHAR(p.DESCRIPTION) AS DESCRIPTION,
         p.CATEGORY,
         p.STOCK,
         p.PRODUCT_TYPE,
         p.AMOUNT,
         p.CREATED_AT,
         p.STARTING_PRICE,
         p.CURRENT_PRICE,
         p.START_TIME,
         p.END_TIME,
         p.REGISTRATION_END,
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

    const productData = {
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
    };

    // 🔹 Add auction details for AUCTION and REGISTRATION types
    if (product.PRODUCT_TYPE === 'AUCTION' || product.PRODUCT_TYPE === 'REGISTRATION') {
      productData.auctionDetails = {
        startingPrice: product.STARTING_PRICE,
        currentPrice: product.CURRENT_PRICE,
        startTime: product.START_TIME,
        endTime: product.END_TIME,
      };

      // Only include registration_end for REGISTRATION type
      if (product.PRODUCT_TYPE === 'REGISTRATION' && product.REGISTRATION_END) {
        productData.auctionDetails.registrationEnd = product.REGISTRATION_END;
      }

      // 🔹 Calculate auction status
      const now = new Date();
      const startTime = new Date(product.START_TIME);
      const endTime = new Date(product.END_TIME);
      const regEnd = product.REGISTRATION_END ? new Date(product.REGISTRATION_END) : null;

      if (product.PRODUCT_TYPE === 'REGISTRATION' && regEnd) {
        if (now < regEnd) {
          productData.auctionDetails.status = 'REGISTRATION_OPEN';
        } else if (now < startTime) {
          productData.auctionDetails.status = 'REGISTRATION_CLOSED';
        } else if (now >= startTime && now < endTime) {
          productData.auctionDetails.status = 'LIVE';
        } else {
          productData.auctionDetails.status = 'ENDED';
        }
      } else {
        // Standard AUCTION type
        if (now < startTime) {
          productData.auctionDetails.status = 'UPCOMING';
        } else if (now >= startTime && now < endTime) {
          productData.auctionDetails.status = 'LIVE';
        } else {
          productData.auctionDetails.status = 'ENDED';
        }
      }

      // 🔹 Fetch bid count for auctions
      const bidCountResult = await connection.execute(
        `SELECT COUNT(*) AS BID_COUNT
         FROM bids
         WHERE ITEM_ID = :itemId`,
        { itemId: ItemId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      productData.auctionDetails.bidCount = bidCountResult.rows[0]?.BID_COUNT || 0;

      // 🔹 Fetch highest bid info
      if (productData.auctionDetails.bidCount > 0) {
        const highestBidResult = await connection.execute(
          `SELECT 
             b.BID_AMOUNT,
             b.BID_TIME,
             u.FIRST_NAME || ' ' || u.LAST_NAME AS BIDDER_NAME
           FROM bids b
           LEFT JOIN users u ON b.BIDDER_ID = u.ID
           WHERE b.ITEM_ID = :itemId
           ORDER BY b.BID_AMOUNT DESC
           FETCH FIRST 1 ROW ONLY`,
          { itemId: ItemId },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (highestBidResult.rows.length > 0) {
          const highestBid = highestBidResult.rows[0];
          productData.auctionDetails.highestBid = {
            amount: highestBid.BID_AMOUNT,
            bidderName: highestBid.BIDDER_NAME,
            bidTime: highestBid.BID_TIME
          };
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: productData
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

// Get user's order history
export async function getOrderHistory(req, res) {
  let connection;
  try {
    const userId = req.user.ID;

    connection = await getConnection();

    // Get all orders for the user
    const ordersResult = await connection.execute(
      `SELECT 
        ORDER_ID,
        ORDER_NUMBER,
        TOTAL_AMOUNT,
        ORDER_STATUS,
        PAYMENT_STATUS,
        ESEWA_TXN_ID,
        ORDER_DATE,
        UPDATED_AT
      FROM orders
      WHERE USER_ID = :userId
      ORDER BY ORDER_DATE DESC`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (ordersResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No orders found",
        data: {
          orders: [],
          totalOrders: 0
        }
      });
    }

    // Get order items with product and seller details for each order
    const ordersWithDetails = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await connection.execute(
          `SELECT 
            oi.ORDER_ITEM_ID,
            oi.ITEM_ID,
            oi.PRODUCT_TITLE,
            oi.PRICE_AT_PURCHASE,
            oi.QUANTITY,
            oi.SUBTOTAL,
            oi.CREATED_AT,
            u.ID as SELLER_ID,
            u.FIRST_NAME || ' ' || u.LAST_NAME as SELLER_NAME,
            u.EMAIL as SELLER_EMAIL,
            u.PROFILE_PICTURE_URL as SELLER_PROFILE_PICTURE
          FROM order_items oi
          LEFT JOIN users u ON oi.SELLER_ID = u.ID
          WHERE oi.ORDER_ID = :orderId
          ORDER BY oi.CREATED_AT`,
          { orderId: order.ORDER_ID },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Get product images for each item
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
                seller: {
                  sellerId: item.SELLER_ID,
                  name: item.SELLER_NAME,
                  email: item.SELLER_EMAIL,
                  profilePicture: item.SELLER_PROFILE_PICTURE
                }
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
                seller: {
                  sellerId: item.SELLER_ID,
                  name: item.SELLER_NAME,
                  email: item.SELLER_EMAIL,
                  profilePicture: item.SELLER_PROFILE_PICTURE
                }
              };
            }
          })
        );

        return {
          orderId: order.ORDER_ID,
          orderNumber: order.ORDER_NUMBER,
          totalAmount: order.TOTAL_AMOUNT,
          orderStatus: order.ORDER_STATUS,
          paymentStatus: order.PAYMENT_STATUS,
          esewaTxnId: order.ESEWA_TXN_ID,
          orderDate: order.ORDER_DATE,
          updatedAt: order.UPDATED_AT,
          items: itemsWithImages,
          itemCount: itemsWithImages.length
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Order history fetched successfully",
      data: {
        orders: ordersWithDetails,
        totalOrders: ordersWithDetails.length
      }
    });

  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order history",
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

// Get single order details by order ID
export async function getOrderById(req, res) {
  let connection;
  try {
    const userId = req.user.ID;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    connection = await getConnection();

    // Get order details
    const orderResult = await connection.execute(
      `SELECT 
        ORDER_ID,
        ORDER_NUMBER,
        TOTAL_AMOUNT,
        ORDER_STATUS,
        PAYMENT_STATUS,
        ESEWA_TXN_ID,
        ORDER_DATE,
        UPDATED_AT
      FROM orders
      WHERE ORDER_ID = :orderId AND USER_ID = :userId`,
      { orderId, userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = orderResult.rows[0];

    // Get order items with seller details
    const itemsResult = await connection.execute(
      `SELECT 
        oi.ORDER_ITEM_ID,
        oi.ITEM_ID,
        oi.PRODUCT_TITLE,
        oi.PRICE_AT_PURCHASE,
        oi.QUANTITY,
        oi.SUBTOTAL,
        oi.CREATED_AT,
        u.ID as SELLER_ID,
        u.FIRST_NAME || ' ' || u.LAST_NAME as SELLER_NAME,
        u.EMAIL as SELLER_EMAIL,
        u.PROFILE_PICTURE_URL as SELLER_PROFILE_PICTURE
      FROM order_items oi
      LEFT JOIN users u ON oi.SELLER_ID = u.ID
      WHERE oi.ORDER_ID = :orderId
      ORDER BY oi.CREATED_AT`,
      { orderId },
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
          seller: {
            sellerId: item.SELLER_ID,
            name: item.SELLER_NAME,
            email: item.SELLER_EMAIL,
            profilePicture: item.SELLER_PROFILE_PICTURE
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: {
        orderId: order.ORDER_ID,
        orderNumber: order.ORDER_NUMBER,
        totalAmount: order.TOTAL_AMOUNT,
        orderStatus: order.ORDER_STATUS,
        paymentStatus: order.PAYMENT_STATUS,
        esewaTxnId: order.ESEWA_TXN_ID,
        orderDate: order.ORDER_DATE,
        updatedAt: order.UPDATED_AT,
        items: itemsWithImages,
        itemCount: itemsWithImages.length
      }
    });

  } catch (error) {
    console.error('Get order by ID error:', error);
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
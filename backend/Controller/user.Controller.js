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
    
    const imageUrl = response;

    const connection = await getConnection();
    await connection.execute(
      `UPDATE users 
       SET profile_picture_url = :url 
       WHERE id = :id`,
      { url: imageUrl, id: userid },
      { autoCommit: true }
    );
    console.log("Uploaded successfully",imageUrl);

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

  // Get user ID from token if present
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

    const { 
      category, 
      product_type, 
      search,
      minPrice,
      maxPrice,
      sortBy,
      minRating
    } = req.query;

    connection = await getConnection();

    // Build dynamic WHERE clause
    let whereClause = " WHERE p.STATUS = 'ACTIVE'";
    const binds = { offset, limit };

    // Search filter - searches in title and description
    if (search) {
      whereClause += ` AND (
        LOWER(p.TITLE) LIKE :search 
        OR DBMS_LOB.INSTR(LOWER(p.DESCRIPTION), :searchTerm) > 0
      )`;
      binds.search = `%${search.toLowerCase()}%`;
      binds.searchTerm = search.toLowerCase();
    }

    // Category filter
    if (category) {
      whereClause += " AND p.CATEGORY = :category";
      binds.category = category;
    }

    // Product type filter
    if (product_type) {
      whereClause += " AND p.PRODUCT_TYPE = :productType";
      binds.productType = product_type;
    }

    // Exclude seller's own products if logged in
    if (userId) {
      whereClause += " AND p.SELLER_ID != :userId";
      binds.userId = userId;
    }

    // Price range filters
    if (minPrice) {
      whereClause += " AND p.AMOUNT >= :minPrice";
      binds.minPrice = parseFloat(minPrice);
    }

    if (maxPrice) {
      whereClause += " AND p.AMOUNT <= :maxPrice";
      binds.maxPrice = parseFloat(maxPrice);
    }

    // Auction-specific filters - only show active auctions
    if (product_type === 'AUCTION' || product_type === 'REGISTRATION') {
      whereClause += " AND p.END_TIME > SYSTIMESTAMP";
    }

    // NEW: Hide REGISTRATION type products where registration ended, unless user is registered
    if (userId) {
      whereClause += ` AND (
        p.PRODUCT_TYPE != 'REGISTRATION' 
        OR p.REGISTRATION_END > SYSTIMESTAMP
        OR EXISTS (
          SELECT 1 FROM auction_registrations ar 
          WHERE ar.ITEM_ID = p.ITEM_ID 
          AND ar.USER_ID = :userIdForReg
          AND ar.IS_ACTIVE = 'Y'
        )
      )`;
      binds.userIdForReg = userId;
    } else {
      // If not logged in, only show REGISTRATION products where registration is still open
      whereClause += ` AND (
        p.PRODUCT_TYPE != 'REGISTRATION' 
        OR p.REGISTRATION_END > SYSTIMESTAMP
      )`;
    }

    // Sorting logic
    let orderBy = "ORDER BY p.CREATED_AT DESC";
    
    if (sortBy === 'price_low') {
      orderBy = "ORDER BY p.AMOUNT ASC";
    } else if (sortBy === 'price_high') {
      orderBy = "ORDER BY p.AMOUNT DESC";
    } else if (sortBy === 'rating') {
      orderBy = "ORDER BY avg_rating DESC NULLS LAST";
    } else if (sortBy === 'popular') {
      orderBy = "ORDER BY review_count DESC NULLS LAST";
    }

    // Enhanced products query with average rating and registration status
    const productsQuery = `
      SELECT 
        p.ITEM_ID,
        p.SELLER_ID,
        p.TITLE,
        DBMS_LOB.SUBSTR(p.DESCRIPTION, 4000, 1) AS DESCRIPTION,
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
        u.PROFILE_PICTURE_URL AS SELLER_PROFILE_PICTURE,
        ROUND(AVG(r.RATING), 1) as avg_rating,
        COUNT(r.REVIEW_ID) as review_count,
        ${userId ? `CASE WHEN EXISTS (
          SELECT 1 FROM auction_registrations ar2
          WHERE ar2.ITEM_ID = p.ITEM_ID 
          AND ar2.USER_ID = :userIdForRegCheck
          AND ar2.IS_ACTIVE = 'Y'
        ) THEN 'Y' ELSE 'N' END` : `'N'`} AS IS_USER_REGISTERED
      FROM products p
      LEFT JOIN users u ON p.SELLER_ID = u.ID
      LEFT JOIN ratings_reviews r ON p.ITEM_ID = r.PRODUCT_ID
      ${whereClause}
      GROUP BY 
        p.ITEM_ID,
        p.SELLER_ID,
        p.TITLE,
        DBMS_LOB.SUBSTR(p.DESCRIPTION, 4000, 1),
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
        u.FIRST_NAME,
        u.LAST_NAME,
        u.EMAIL,
        u.PROFILE_PICTURE_URL
      ${minRating ? `HAVING AVG(r.RATING) >= ${parseFloat(minRating)}` : ''}
      ${orderBy}
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    // Count query with same filters
    const countQuery = `
      SELECT COUNT(DISTINCT p.ITEM_ID) AS TOTAL_COUNT
      FROM products p
      LEFT JOIN users u ON p.SELLER_ID = u.ID
      LEFT JOIN ratings_reviews r ON p.ITEM_ID = r.PRODUCT_ID
      ${whereClause}
      ${minRating ? `GROUP BY p.ITEM_ID HAVING AVG(r.RATING) >= ${parseFloat(minRating)}` : ''}
    `;
    
    const countBinds = { ...binds };
    delete countBinds.offset;
    delete countBinds.limit;

    // Add userIdForRegCheck to binds if userId exists
    if (userId) {
      binds.userIdForRegCheck = userId;
    }

    // Execute queries in parallel
    const [productsResult, countResult] = await Promise.all([
      connection.execute(productsQuery, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      connection.execute(countQuery, countBinds, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    ]);

    const totalCount = minRating 
      ? countResult.rows.length 
      : (countResult.rows[0]?.TOTAL_COUNT || 0);

    // Fetch product images
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
          // Add rating information
          rating: {
            average: product.AVG_RATING ? parseFloat(product.AVG_RATING) : null,
            count: parseInt(product.REVIEW_COUNT || 0)
          },
          // Add registration status for REGISTRATION type products
          isUserRegistered: product.IS_USER_REGISTERED === 'Y',
          images: imagesResult.rows.map((img) => ({
            url: img.IMAGE_URL,
            isPrimary: img.IS_PRIMARY === 'Y',
            displayOrder: img.DISPLAY_ORDER,
          })),
        };

        // Add auction details for AUCTION and REGISTRATION types
        if (product.PRODUCT_TYPE === 'AUCTION' || product.PRODUCT_TYPE === 'REGISTRATION') {
          productData.auctionDetails = {
            startingPrice: product.STARTING_PRICE,
            currentPrice: product.CURRENT_PRICE,
            startTime: product.START_TIME,
            endTime: product.END_TIME,
          };

          if (product.PRODUCT_TYPE === 'REGISTRATION' && product.REGISTRATION_END) {
            productData.auctionDetails.registrationEnd = product.REGISTRATION_END;
          }

          // Calculate auction status
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

    // Send response
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
        filters: {
          search: search || null,
          category: category || null,
          productType: product_type || null,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          minRating: minRating || null,
          sortBy: sortBy || 'newest'
        }
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

// export async function getProductById(req, res) {
//   const { ItemId } = req.params;
//   let connection;
//   try {
//     if (!ItemId) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Item id is required" 
//       });
//     }

//     connection = await getConnection();
    
//     const result = await connection.execute(
//       `SELECT 
//          p.ITEM_ID,
//          p.SELLER_ID,
//          p.TITLE,
//          TO_CHAR(p.DESCRIPTION) AS DESCRIPTION,
//          p.CATEGORY,
//          p.STOCK,
//          p.PRODUCT_TYPE,
//          p.AMOUNT,
//          p.CREATED_AT,
//          p.STARTING_PRICE,
//          p.CURRENT_PRICE,
//          p.START_TIME,
//          p.END_TIME,
//          p.REGISTRATION_END,
//          u.FIRST_NAME || ' ' || u.LAST_NAME AS SELLER_NAME,
//          u.EMAIL AS SELLER_EMAIL,
//          u.PROFILE_PICTURE_URL AS SELLER_PROFILE_PICTURE
//        FROM products p
//        LEFT JOIN users u ON p.SELLER_ID = u.ID
//        WHERE p.ITEM_ID = :itemId
//          AND p.STATUS = 'ACTIVE'`,
//       { itemId: ItemId },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: "Product not found" 
//       });
//     }

//     const product = result.rows[0];

//     // Fetch product images
//     const imagesResult = await connection.execute(
//       `SELECT IMAGE_URL, IS_PRIMARY, DISPLAY_ORDER 
//        FROM product_images 
//        WHERE ITEM_ID = :itemId 
//        ORDER BY DISPLAY_ORDER`,
//       { itemId: ItemId },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );
    
//     const images = imagesResult.rows.map((img) => ({
//       url: img.IMAGE_URL,
//       isPrimary: img.IS_PRIMARY === "Y",
//       displayOrder: img.DISPLAY_ORDER,
//     }));

//     // 🔹 Fetch total items sold by seller (for badge system)
//     const sellerSalesResult = await connection.execute(
//       `SELECT NVL(SUM(oi.QUANTITY), 0) as TOTAL_ITEMS_SOLD
//        FROM order_items oi
//        INNER JOIN orders o ON oi.ORDER_ID = o.ORDER_ID
//        WHERE oi.SELLER_ID = :sellerId
//          AND o.ORDER_STATUS = 'COMPLETED'`,
//       { sellerId: product.SELLER_ID },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     const totalItemsSold = parseInt(sellerSalesResult.rows[0]?.TOTAL_ITEMS_SOLD || 0);

//     const productData = {
//       itemId: product.ITEM_ID,
//       title: product.TITLE,
//       description: product.DESCRIPTION,
//       category: product.CATEGORY,
//       stock: product.STOCK,
//       productType: product.PRODUCT_TYPE,
//       amount: product.AMOUNT,
//       createdAt: product.CREATED_AT,
//       seller: {
//         sellerId: product.SELLER_ID,
//         name: product.SELLER_NAME,
//         email: product.SELLER_EMAIL,
//         profilePicture: product.SELLER_PROFILE_PICTURE,
//         totalItemsSold: totalItemsSold
//       },
//       images
//     };

//     // 🔹 Add auction details for AUCTION and REGISTRATION types
//     if (product.PRODUCT_TYPE === 'AUCTION' || product.PRODUCT_TYPE === 'REGISTRATION') {
//       productData.auctionDetails = {
//         startingPrice: product.STARTING_PRICE,
//         currentPrice: product.CURRENT_PRICE,
//         startTime: product.START_TIME,
//         endTime: product.END_TIME,
//       };

//       // Only include registration_end for REGISTRATION type
//       if (product.PRODUCT_TYPE === 'REGISTRATION' && product.REGISTRATION_END) {
//         productData.auctionDetails.registrationEnd = product.REGISTRATION_END;
//       }

//       // 🔹 Calculate auction status
//       const now = new Date();
//       const startTime = new Date(product.START_TIME);
//       const endTime = new Date(product.END_TIME);
//       const regEnd = product.REGISTRATION_END ? new Date(product.REGISTRATION_END) : null;

//       if (product.PRODUCT_TYPE === 'REGISTRATION' && regEnd) {
//         if (now < regEnd) {
//           productData.auctionDetails.status = 'REGISTRATION_OPEN';
//         } else if (now < startTime) {
//           productData.auctionDetails.status = 'REGISTRATION_CLOSED';
//         } else if (now >= startTime && now < endTime) {
//           productData.auctionDetails.status = 'LIVE';
//         } else {
//           productData.auctionDetails.status = 'ENDED';
//         }
//       } else {
//         // Standard AUCTION type
//         if (now < startTime) {
//           productData.auctionDetails.status = 'UPCOMING';
//         } else if (now >= startTime && now < endTime) {
//           productData.auctionDetails.status = 'LIVE';
//         } else {
//           productData.auctionDetails.status = 'ENDED';
//         }
//       }

//       // 🔹 Fetch bid count for auctions
//       const bidCountResult = await connection.execute(
//         `SELECT COUNT(*) AS BID_COUNT
//          FROM bids
//          WHERE ITEM_ID = :itemId`,
//         { itemId: ItemId },
//         { outFormat: oracledb.OUT_FORMAT_OBJECT }
//       );

//       productData.auctionDetails.bidCount = bidCountResult.rows[0]?.BID_COUNT || 0;

//       // 🔹 Fetch highest bid info (FIXED HERE)
//       if (productData.auctionDetails.bidCount > 0) {
//         const highestBidResult = await connection.execute(
//           `SELECT 
//              b.BID_AMOUNT,
//              b.CREATED_AT AS BID_TIME,
//              u.FIRST_NAME || ' ' || u.LAST_NAME AS BIDDER_NAME
//            FROM bids b
//            LEFT JOIN users u ON b.USER_ID = u.ID
//            WHERE b.ITEM_ID = :itemId
//            ORDER BY b.BID_AMOUNT DESC
//            FETCH FIRST 1 ROW ONLY`,
//           { itemId: ItemId },
//           { outFormat: oracledb.OUT_FORMAT_OBJECT }
//         );

//         if (highestBidResult.rows.length > 0) {
//           const highestBid = highestBidResult.rows[0];
//           productData.auctionDetails.highestBid = {
//             amount: highestBid.BID_AMOUNT,
//             bidderName: highestBid.BIDDER_NAME,
//             bidTime: highestBid.BID_TIME
//           };
//         }
//       }
//     }

//     // ⭐ FETCH REVIEWS & RATINGS
//     const reviewsResult = await connection.execute(
//       `SELECT 
//          r.REVIEW_ID,
//          r.RATING,
//          DBMS_LOB.SUBSTR(r.REVIEW_TEXT, 4000, 1) as REVIEW_TEXT,
//          TO_CHAR(r.CREATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') as REVIEW_CREATED_AT,
//          TO_CHAR(r.UPDATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') as REVIEW_UPDATED_AT,
//          u.ID as REVIEWER_ID,
//          u.FIRST_NAME || ' ' || u.LAST_NAME as REVIEWER_NAME,
//          u.PROFILE_PICTURE_URL as REVIEWER_PROFILE_PICTURE,
//          r.ORDER_ITEM_ID
//        FROM ratings_reviews r
//        INNER JOIN users u ON r.USER_ID = u.ID
//        INNER JOIN order_items oi ON r.ORDER_ITEM_ID = oi.ORDER_ITEM_ID
//        INNER JOIN orders o ON oi.ORDER_ID = o.ORDER_ID
//        WHERE r.PRODUCT_ID = :itemId
//          AND o.ORDER_STATUS = 'COMPLETED'
//        ORDER BY r.CREATED_AT DESC`,
//       { itemId: ItemId },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     // Process reviews
//     const reviews = reviewsResult.rows.map(review => ({
//       reviewId: parseInt(review.REVIEW_ID),
//       rating: parseInt(review.RATING),
//       reviewText: review.REVIEW_TEXT ? (review.REVIEW_TEXT + '') : null,
//       createdAt: review.REVIEW_CREATED_AT ? review.REVIEW_CREATED_AT + '' : null,
//       updatedAt: review.REVIEW_UPDATED_AT ? review.REVIEW_UPDATED_AT + '' : null,
//       reviewer: {
//         reviewerId: parseInt(review.REVIEWER_ID),
//         name: (review.REVIEWER_NAME || '') + '',
//         profilePicture: review.REVIEWER_PROFILE_PICTURE ? review.REVIEWER_PROFILE_PICTURE + '' : null
//       },
//       verifiedPurchase: true
//     }));

//     // Rating statistics
//     const ratingStats = {
//       totalReviews: reviews.length,
//       averageRating: 0,
//       ratingDistribution: {
//         5: 0,
//         4: 0,
//         3: 0,
//         2: 0,
//         1: 0
//       }
//     };

//     if (reviews.length > 0) {
//       const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
//       ratingStats.averageRating = parseFloat((totalRating / reviews.length).toFixed(1));

//       reviews.forEach(review => {
//         ratingStats.ratingDistribution[review.rating]++;
//       });
//     }

//     productData.reviews = reviews;
//     productData.ratingStats = ratingStats;

//     res.status(200).json({
//       success: true,
//       message: "Product fetched successfully",
//       data: productData
//     });

//   } catch (error) {
//     console.error("Get product by ID error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch product",
//       error: error.message,
//     });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (closeError) {
//         console.error("Connection close error:", closeError);
//       }
//     }
//   }
// }



// Get user's order history
// export async function getOrderHistory(req, res) {
//   let connection;
//   try {
//     const userId = req.user.ID;

//     connection = await getConnection();

//     // Get all orders for the user
//     const ordersResult = await connection.execute(
//       `SELECT 
//         ORDER_ID,
//         ORDER_NUMBER,
//         TOTAL_AMOUNT,
//         ORDER_STATUS,
//         PAYMENT_STATUS,
//         ESEWA_TXN_ID,
//         ORDER_DATE,
//         UPDATED_AT
//       FROM orders
//       WHERE USER_ID = :userId
//       ORDER BY ORDER_DATE DESC`,
//       { userId },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     if (ordersResult.rows.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No orders found",
//         data: {
//           orders: [],
//           totalOrders: 0
//         }
//       });
//     }

//     // Get order items with product and seller details for each order
//     const ordersWithDetails = await Promise.all(
//       ordersResult.rows.map(async (order) => {
//         const itemsResult = await connection.execute(
//           `SELECT 
//             oi.ORDER_ITEM_ID,
//             oi.ITEM_ID,
//             oi.PRODUCT_TITLE,
//             oi.PRICE_AT_PURCHASE,
//             oi.QUANTITY,
//             oi.SUBTOTAL,
//             oi.CREATED_AT,
//             u.ID as SELLER_ID,
//             u.FIRST_NAME || ' ' || u.LAST_NAME as SELLER_NAME,
//             u.EMAIL as SELLER_EMAIL,
//             u.PROFILE_PICTURE_URL as SELLER_PROFILE_PICTURE
//           FROM order_items oi
//           LEFT JOIN users u ON oi.SELLER_ID = u.ID
//           WHERE oi.ORDER_ID = :orderId
//           ORDER BY oi.CREATED_AT`,
//           { orderId: order.ORDER_ID },
//           { outFormat: oracledb.OUT_FORMAT_OBJECT }
//         );

//         // Get product images for each item
//         const itemsWithImages = await Promise.all(
//           itemsResult.rows.map(async (item) => {
//             try {
//               const imagesResult = await connection.execute(
//                 `SELECT IMAGE_URL, IS_PRIMARY
//                  FROM product_images
//                  WHERE ITEM_ID = :itemId
//                  ORDER BY DISPLAY_ORDER`,
//                 { itemId: item.ITEM_ID },
//                 { outFormat: oracledb.OUT_FORMAT_OBJECT }
//               );

//               const primaryImage = imagesResult.rows.find(img => img.IS_PRIMARY === 'Y')?.IMAGE_URL ||
//                                  imagesResult.rows[0]?.IMAGE_URL || null;

//               return {
//                 orderItemId: item.ORDER_ITEM_ID,
//                 itemId: item.ITEM_ID,
//                 productTitle: item.PRODUCT_TITLE,
//                 priceAtPurchase: item.PRICE_AT_PURCHASE,
//                 quantity: item.QUANTITY,
//                 subtotal: item.SUBTOTAL,
//                 primaryImage: primaryImage,
//                 seller: {
//                   sellerId: item.SELLER_ID,
//                   name: item.SELLER_NAME,
//                   email: item.SELLER_EMAIL,
//                   profilePicture: item.SELLER_PROFILE_PICTURE
//                 }
//               };
//             } catch (imageError) {
//               console.error('Error fetching images for item:', item.ITEM_ID, imageError);
//               return {
//                 orderItemId: item.ORDER_ITEM_ID,
//                 itemId: item.ITEM_ID,
//                 productTitle: item.PRODUCT_TITLE,
//                 priceAtPurchase: item.PRICE_AT_PURCHASE,
//                 quantity: item.QUANTITY,
//                 subtotal: item.SUBTOTAL,
//                 primaryImage: null,
//                 seller: {
//                   sellerId: item.SELLER_ID,
//                   name: item.SELLER_NAME,
//                   email: item.SELLER_EMAIL,
//                   profilePicture: item.SELLER_PROFILE_PICTURE
//                 }
//               };
//             }
//           })
//         );

//         return {
//           orderId: order.ORDER_ID,
//           orderNumber: order.ORDER_NUMBER,
//           totalAmount: order.TOTAL_AMOUNT,
//           orderStatus: order.ORDER_STATUS,
//           paymentStatus: order.PAYMENT_STATUS,
//           esewaTxnId: order.ESEWA_TXN_ID,
//           orderDate: order.ORDER_DATE,
//           updatedAt: order.UPDATED_AT,
//           items: itemsWithImages,
//           itemCount: itemsWithImages.length
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       message: "Order history fetched successfully",
//       data: {
//         orders: ordersWithDetails,
//         totalOrders: ordersWithDetails.length
//       }
//     });

//   } catch (error) {
//     console.error('Get order history error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch order history",
//       error: error.message
//     });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (err) {
//         console.error('Connection close error:', err);
//       }
//     }
//   }
// }

// Get single order details by order ID

export async function getProductById(req, res) {
  const { ItemId } = req.params;
  let connection;
  let userId = null;

  // Get user ID from token if present
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }
  } catch {
    // No valid token, continue without userId
  }

  try {
    if (!ItemId) {
      return res.status(400).json({ 
        success: false,
        message: "Item id is required" 
      });
    }

    connection = await getConnection();
    
    // Build query with conditional registration status check
    const query = `SELECT 
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
         u.PROFILE_PICTURE_URL AS SELLER_PROFILE_PICTURE,
         ${userId ? `CASE WHEN EXISTS (
           SELECT 1 FROM auction_registrations ar
           WHERE ar.ITEM_ID = p.ITEM_ID 
           AND ar.USER_ID = :userId
           AND ar.IS_ACTIVE = 'Y'
         ) THEN 'Y' ELSE 'N' END` : `'N'`} AS IS_USER_REGISTERED
       FROM products p
       LEFT JOIN users u ON p.SELLER_ID = u.ID
       WHERE p.ITEM_ID = :itemId
         AND p.STATUS = 'ACTIVE'`;

    const binds = { itemId: ItemId };
    if (userId) {
      binds.userId = userId;
    }

    const result = await connection.execute(
      query,
      binds,
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

    // 🔹 Fetch total items sold by seller (for badge system)
    const sellerSalesResult = await connection.execute(
      `SELECT NVL(SUM(oi.QUANTITY), 0) as TOTAL_ITEMS_SOLD
       FROM order_items oi
       INNER JOIN orders o ON oi.ORDER_ID = o.ORDER_ID
       WHERE oi.SELLER_ID = :sellerId
         AND o.ORDER_STATUS = 'COMPLETED'`,
      { sellerId: product.SELLER_ID },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const totalItemsSold = parseInt(sellerSalesResult.rows[0]?.TOTAL_ITEMS_SOLD || 0);

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
        totalItemsSold: totalItemsSold
      },
      images,
      isUserRegistered: product.IS_USER_REGISTERED === 'Y' // Add registration status
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
             b.CREATED_AT AS BID_TIME,
             u.FIRST_NAME || ' ' || u.LAST_NAME AS BIDDER_NAME
           FROM bids b
           LEFT JOIN users u ON b.USER_ID = u.ID
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

    // ⭐ FETCH REVIEWS & RATINGS
    const reviewsResult = await connection.execute(
      `SELECT 
         r.REVIEW_ID,
         r.RATING,
         DBMS_LOB.SUBSTR(r.REVIEW_TEXT, 4000, 1) as REVIEW_TEXT,
         TO_CHAR(r.CREATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') as REVIEW_CREATED_AT,
         TO_CHAR(r.UPDATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') as REVIEW_UPDATED_AT,
         u.ID as REVIEWER_ID,
         u.FIRST_NAME || ' ' || u.LAST_NAME as REVIEWER_NAME,
         u.PROFILE_PICTURE_URL as REVIEWER_PROFILE_PICTURE,
         r.ORDER_ITEM_ID
       FROM ratings_reviews r
       INNER JOIN users u ON r.USER_ID = u.ID
       INNER JOIN order_items oi ON r.ORDER_ITEM_ID = oi.ORDER_ITEM_ID
       INNER JOIN orders o ON oi.ORDER_ID = o.ORDER_ID
       WHERE r.PRODUCT_ID = :itemId
         AND o.ORDER_STATUS = 'COMPLETED'
       ORDER BY r.CREATED_AT DESC`,
      { itemId: ItemId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Process reviews
    const reviews = reviewsResult.rows.map(review => ({
      reviewId: parseInt(review.REVIEW_ID),
      rating: parseInt(review.RATING),
      reviewText: review.REVIEW_TEXT ? (review.REVIEW_TEXT + '') : null,
      createdAt: review.REVIEW_CREATED_AT ? review.REVIEW_CREATED_AT + '' : null,
      updatedAt: review.REVIEW_UPDATED_AT ? review.REVIEW_UPDATED_AT + '' : null,
      reviewer: {
        reviewerId: parseInt(review.REVIEWER_ID),
        name: (review.REVIEWER_NAME || '') + '',
        profilePicture: review.REVIEWER_PROFILE_PICTURE ? review.REVIEWER_PROFILE_PICTURE + '' : null
      },
      verifiedPurchase: true
    }));

    // Rating statistics
    const ratingStats = {
      totalReviews: reviews.length,
      averageRating: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    };

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      ratingStats.averageRating = parseFloat((totalRating / reviews.length).toFixed(1));

      reviews.forEach(review => {
        ratingStats.ratingDistribution[review.rating]++;
      });
    }

    productData.reviews = reviews;
    productData.ratingStats = ratingStats;

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


export async function getOrderHistory(req, res) {
  let connection;
  try {
    const userId = req.user.ID;
    connection = await getConnection();

    // Get all orders
    const ordersResult = await connection.execute(
      `SELECT 
        ORDER_ID,
        ORDER_NUMBER,
        TOTAL_AMOUNT,
        ORDER_STATUS,
        PAYMENT_STATUS,
        ESEWA_TXN_ID,
        TO_CHAR(ORDER_DATE, 'YYYY-MM-DD"T"HH24:MI:SS') as ORDER_DATE,
        TO_CHAR(UPDATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') as UPDATED_AT
      FROM orders
      WHERE USER_ID = :1
      ORDER BY ORDER_DATE DESC`,
      [userId],
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

    const orders = [];
    
    for (let i = 0; i < ordersResult.rows.length; i++) {
      const order = ordersResult.rows[i];
      
      //  FIX: Use DBMS_LOB.SUBSTR to convert CLOB to string
      const itemsResult = await connection.execute(
        `SELECT 
          oi.ORDER_ITEM_ID,
          oi.ITEM_ID,
          oi.PRODUCT_TITLE,
          oi.PRICE_AT_PURCHASE,
          oi.QUANTITY,
          oi.SUBTOTAL,
          u.ID as SELLER_ID,
          u.FIRST_NAME || ' ' || u.LAST_NAME as SELLER_NAME,
          u.EMAIL as SELLER_EMAIL,
          u.PROFILE_PICTURE_URL as SELLER_PROFILE_PICTURE,
          r.REVIEW_ID,
          r.RATING,
          DBMS_LOB.SUBSTR(r.REVIEW_TEXT, 4000, 1) as REVIEW_TEXT,
          TO_CHAR(r.CREATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') as REVIEW_CREATED_AT,
          TO_CHAR(r.UPDATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') as REVIEW_UPDATED_AT
        FROM order_items oi
        LEFT JOIN users u ON oi.SELLER_ID = u.ID
        LEFT JOIN ratings_reviews r ON oi.ORDER_ITEM_ID = r.ORDER_ITEM_ID
        WHERE oi.ORDER_ID = :1`,
        [order.ORDER_ID],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const items = [];
      
      for (let j = 0; j < itemsResult.rows.length; j++) {
        const item = itemsResult.rows[j];
        
        // Get images
        const imagesResult = await connection.execute(
          `SELECT IMAGE_URL, IS_PRIMARY
           FROM product_images
           WHERE ITEM_ID = :1
           ORDER BY DISPLAY_ORDER`,
          [item.ITEM_ID],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        let primaryImage = null;
        if (imagesResult.rows.length > 0) {
          for (let k = 0; k < imagesResult.rows.length; k++) {
            if (imagesResult.rows[k].IS_PRIMARY === 'Y') {
              primaryImage = imagesResult.rows[k].IMAGE_URL + '';
              break;
            }
          }
          if (!primaryImage && imagesResult.rows[0]) {
            primaryImage = imagesResult.rows[0].IMAGE_URL + '';
          }
        }

        // Build item object
        const cleanItem = {
          orderItemId: parseInt(item.ORDER_ITEM_ID),
          itemId: parseInt(item.ITEM_ID),
          productId: parseInt(item.ITEM_ID),
          productTitle: (item.PRODUCT_TITLE || '') + '',
          priceAtPurchase: parseFloat(item.PRICE_AT_PURCHASE || 0),
          quantity: parseInt(item.QUANTITY || 0),
          subtotal: parseFloat(item.SUBTOTAL || 0),
          primaryImage: primaryImage,
          seller: {
            sellerId: parseInt(item.SELLER_ID || 0),
            name: (item.SELLER_NAME || '') + '',
            email: (item.SELLER_EMAIL || '') + '',
            profilePicture: item.SELLER_PROFILE_PICTURE ? item.SELLER_PROFILE_PICTURE + '' : null
          },
          review: item.REVIEW_ID ? {
            reviewId: parseInt(item.REVIEW_ID),
            rating: parseInt(item.RATING),
            reviewText: item.REVIEW_TEXT ? (item.REVIEW_TEXT + '') : null, // ⭐ Force to string
            createdAt: item.REVIEW_CREATED_AT ? item.REVIEW_CREATED_AT + '' : null,
            updatedAt: item.REVIEW_UPDATED_AT ? item.REVIEW_UPDATED_AT + '' : null
          } : null
        };
        
        items.push(cleanItem);
      }

      const cleanOrder = {
        orderId: parseInt(order.ORDER_ID),
        orderNumber: (order.ORDER_NUMBER || '') + '',
        totalAmount: parseFloat(order.TOTAL_AMOUNT || 0),
        orderStatus: (order.ORDER_STATUS || '') + '',
        paymentStatus: (order.PAYMENT_STATUS || '') + '',
        esewaTxnId: (order.ESEWA_TXN_ID || '') + '',
        orderDate: order.ORDER_DATE ? order.ORDER_DATE + '' : null,
        updatedAt: order.UPDATED_AT ? order.UPDATED_AT + '' : null,
        items: items,
        itemCount: items.length
      };
      
      orders.push(cleanOrder);
    }

    const responseData = {
      success: true,
      message: "Order history fetched successfully",
      data: {
        orders: orders,
        totalOrders: orders.length
      }
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Get order history error:', error);
    return res.status(500).json({
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

// ============================================
// ADD OR UPDATE REVIEW AND RATING (Combined)
// POST /api/reviews
// Body: { orderItemId, productId, rating, reviewText }
// Automatically handles both INSERT and UPDATE using MERGE
// ============================================
export async function addOrUpdateReview(req, res) {
  let connection;
  const { orderItemId, productId, rating, reviewText } = req.body;
  const userId = req.user.ID;
  
  try {
    // Validate required fields (reviewText is optional)
    if (!orderItemId || !productId || !rating) {
      return res.status(400).json({
        message: "Order item ID, product ID, and rating are required",
        success: false
      });
    }

    // Validate rating range (must be 1-5)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
        success: false
      });
    }

    connection = await getConnection();

    // SECURITY CHECK: Verify the order belongs to the user and is completed
    const verifyResult = await connection.execute(
      `SELECT 
        oi.ORDER_ITEM_ID,
        oi.ITEM_ID
      FROM order_items oi
      JOIN orders o ON oi.ORDER_ID = o.ORDER_ID
      WHERE oi.ORDER_ITEM_ID = :orderItemId
        AND o.USER_ID = :userId
        AND o.ORDER_STATUS = 'COMPLETED'`,
      { orderItemId, userId },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Check if order exists and belongs to user
    if (verifyResult.rows.length === 0) {
      return res.status(403).json({
        message: "Order not found, not completed, or doesn't belong to you",
        success: false
      });
    }

    // MERGE query: INSERT if not exists, UPDATE if exists
    // This handles both add and update in a single query
    const result = await connection.execute(
      `MERGE INTO ratings_reviews r
       USING (SELECT :orderItemId as ORDER_ITEM_ID FROM DUAL) src
       ON (r.ORDER_ITEM_ID = src.ORDER_ITEM_ID)
       WHEN MATCHED THEN
         UPDATE SET 
           r.RATING = :rating,
           r.REVIEW_TEXT = :reviewText,
           r.UPDATED_AT = CURRENT_TIMESTAMP
       WHEN NOT MATCHED THEN
         INSERT (ORDER_ITEM_ID, PRODUCT_ID, USER_ID, RATING, REVIEW_TEXT)
         VALUES (:orderItemId, :productId, :userId, :rating, :reviewText)`,
      { 
        orderItemId, 
        productId, 
        userId, 
        rating, 
        reviewText: reviewText || null
      },
      { autoCommit: true }
    );

    // Success response
    return res.status(200).json({
      message: "Review saved successfully",
      success: true
    });

  } catch (error) {
    console.error("Save review error:", error);
    
    // Handle foreign key violation (invalid IDs)
    if (error.errorNum === 2291) {
      return res.status(404).json({
        message: "Invalid order item or product ID",
        success: false
      });
    }

    // Generic error response
    return res.status(500).json({
      message: "Failed to save review",
      success: false,
      error: error.message
    });
    
  } finally {
    // Always close the database connection
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// ============================================
// DELETE REVIEW (Optional)
// DELETE /api/reviews/:orderItemId
// Allows user to delete their own review
// ============================================
export async function deleteReview(req, res) {
  let connection;
  const { orderItemId } = req.params;
  const userId = req.user.ID;
  
  try {
    // Validate parameter
    if (!orderItemId) {
      return res.status(400).json({
        message: "Order item ID is required",
        success: false
      });
    }

    connection = await getConnection();

    // Delete the review (only user's own review)
    const result = await connection.execute(
      `DELETE FROM ratings_reviews
       WHERE ORDER_ITEM_ID = :orderItemId
         AND USER_ID = :userId`,
      { orderItemId, userId },
      { autoCommit: true }
    );

    // Check if any row was deleted
    if (result.rowsAffected === 0) {
      return res.status(404).json({
        message: "Review not found or you don't have permission to delete it",
        success: false
      });
    }

    return res.status(200).json({
      message: "Review deleted successfully",
      success: true
    });

  } catch (error) {
    console.error("Delete review error:", error);
    
    return res.status(500).json({
      message: "Failed to delete review",
      success: false,
      error: error.message
    });
    
  } finally {
    // Close connection
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}


export async function updateName(req,res)
{
  let connection;
  try {
    const userId = req.user.ID;
    const { firstName, lastName } = req.body;

    if(!firstName || !lastName)
    {
      return res.status(400).json({
        message: "First name and last name are required",
        success: false
      });
    }

    connection = await getConnection();

    const result = await connection.execute(
      `UPDATE users
       SET FIRST_NAME = :firstName,
           LAST_NAME = :lastName,
           UPDATED_AT = CURRENT_TIMESTAMP
       WHERE ID = :userId`,
      { firstName, lastName, userId },
      { autoCommit: true }
    );
    if(result.rowsAffected === 0)
    {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }
    return res.status(200).json({
      message: "Name updated successfully",
      success: true
    });
  } catch (error) {
    console.log("Update name error:", error);
    return res.status(500).json({
      message: "Failed to update name",
      success: false,
      error: error.message
    });
  }
}


export async function getBiddedProducts(req, res) {
  let connection;
  
  try {
    const userId = req.user.ID;
    console.log("Fetching bidded products for user ID:", userId);
    
    connection = await getConnection();
    
    // First, let's test if the user has any bids at all
    const testQuery = `
      SELECT COUNT(*) as bid_count
      FROM BIDS
      WHERE USER_ID = :userId AND BID_STATUS = 'ACTIVE'
    `;
    
    const testResult = await connection.execute(testQuery, { userId });
    console.log("User has", testResult.rows[0][0], "active bids");
    
    if (testResult.rows[0][0] === 0) {
      return res.json({
        success: true,
        message: "No bidded products found",
        data: {
          products: [],
          summary: {
            total: 0,
            winning: 0,
            outbid: 0,
            won: 0,
            lost: 0,
            pending: 0
          }
        }
      });
    }
    
    // Main query - simplified with unique parameter names
    const query = `
      SELECT 
        p.ITEM_ID,
        p.TITLE,
        p.DESCRIPTION,
        p.CATEGORY,
        p.PRODUCT_TYPE,
        p.STARTING_PRICE,
        p.CURRENT_PRICE,
        p.START_TIME,
        p.END_TIME,
        p.REGISTRATION_END,
        p.STATUS as PRODUCT_STATUS,
        p.SELLER_ID,
        
        -- User's highest bid on this product (index 12-14)
        user_bid.MAX_BID_AMOUNT as USER_MAX_BID,
        user_bid.TOTAL_BIDS as USER_TOTAL_BIDS,
        user_bid.LAST_BID_TIME,
        
        -- Current highest bid info (index 15-17)
        highest_bid.BID_AMOUNT as HIGHEST_BID_AMOUNT,
        highest_bid.USER_ID as HIGHEST_BIDDER_ID,
        highest_bid.BIDDER_NAME as HIGHEST_BIDDER_NAME,
        
        -- Winner info (if auction ended) (index 18-20)
        aw.USER_ID as WINNER_ID,
        aw.WINNING_BID,
        aw.PAYMENT_STATUS as WINNER_PAYMENT_STATUS,
        
        -- Seller info (index 21-22)
        u.FIRST_NAME || ' ' || u.LAST_NAME as SELLER_NAME,
        u.PROFILE_PICTURE_URL as SELLER_PROFILE_PICTURE,
        
        -- Calculate bid status (index 23)
        CASE
          WHEN p.START_TIME > SYSTIMESTAMP THEN 'PENDING'
          WHEN p.END_TIME < SYSTIMESTAMP AND aw.USER_ID = :userId1 THEN 'WON'
          WHEN p.END_TIME < SYSTIMESTAMP AND (aw.USER_ID IS NULL OR aw.USER_ID != :userId2) THEN 'LOST'
          WHEN p.START_TIME <= SYSTIMESTAMP 
            AND p.END_TIME > SYSTIMESTAMP 
            AND highest_bid.USER_ID = :userId3 THEN 'WINNING'
          WHEN p.START_TIME <= SYSTIMESTAMP 
            AND p.END_TIME > SYSTIMESTAMP 
            AND (highest_bid.USER_ID IS NULL OR highest_bid.USER_ID != :userId4) THEN 'OUTBID'
          ELSE 'UNKNOWN'
        END as BID_STATUS
        
      FROM PRODUCTS p
      
      -- Get user's bid info
      INNER JOIN (
        SELECT 
          b.ITEM_ID,
          MAX(b.BID_AMOUNT) as MAX_BID_AMOUNT,
          COUNT(*) as TOTAL_BIDS,
          MAX(b.CREATED_AT) as LAST_BID_TIME
        FROM BIDS b
        WHERE b.USER_ID = :userId5
          AND b.BID_STATUS = 'ACTIVE'
        GROUP BY b.ITEM_ID
      ) user_bid ON p.ITEM_ID = user_bid.ITEM_ID
      
      -- Get current highest bid
      LEFT JOIN (
        SELECT 
          b.ITEM_ID,
          b.BID_AMOUNT,
          b.USER_ID,
          u.FIRST_NAME || ' ' || u.LAST_NAME as BIDDER_NAME
        FROM BIDS b
        INNER JOIN USERS u ON b.USER_ID = u.ID
        WHERE b.BID_STATUS = 'ACTIVE'
          AND (b.ITEM_ID, b.BID_AMOUNT) IN (
            SELECT ITEM_ID, MAX(BID_AMOUNT)
            FROM BIDS
            WHERE BID_STATUS = 'ACTIVE'
            GROUP BY ITEM_ID
          )
      ) highest_bid ON p.ITEM_ID = highest_bid.ITEM_ID
      
      -- Get winner info if exists
      LEFT JOIN AUCTION_WINNERS aw ON p.ITEM_ID = aw.ITEM_ID
      
      -- Get seller info
      LEFT JOIN USERS u ON p.SELLER_ID = u.ID
      
      WHERE p.PRODUCT_TYPE IN ('AUCTION', 'REGISTRATION')
      ORDER BY 
        CASE 
          WHEN p.END_TIME > SYSTIMESTAMP THEN 1
          ELSE 2
        END,
        p.END_TIME ASC
    `;
    
    // Bind all userId parameters
    const bindParams = {
      userId1: userId,
      userId2: userId,
      userId3: userId,
      userId4: userId,
      userId5: userId
    };
    
    const result = await connection.execute(query, bindParams);
    
    console.log("Query returned", result.rows?.length || 0, "rows");
    
    if (!result.rows || result.rows.length === 0) {
      return res.json({
        success: true,
        message: "No bidded products found",
        data: {
          products: [],
          summary: {
            total: 0,
            winning: 0,
            outbid: 0,
            won: 0,
            lost: 0,
            pending: 0
          }
        }
      });
    }
    
    // Process the results
    const products = [];
    const summary = {
      total: 0,
      winning: 0,
      outbid: 0,
      won: 0,
      lost: 0,
      pending: 0
    };
    
    for (const row of result.rows) {
      const itemId = row[0];
      
      // Get product images
      const imageQuery = `
        SELECT IMAGE_URL, IS_PRIMARY, DISPLAY_ORDER
        FROM PRODUCT_IMAGES
        WHERE ITEM_ID = :itemId
        ORDER BY 
          CASE WHEN IS_PRIMARY = 'Y' THEN 0 ELSE 1 END,
          DISPLAY_ORDER ASC
      `;
      
      const imageResult = await connection.execute(imageQuery, { itemId });
      const images = imageResult.rows.map(img => ({
        url: img[0],
        isPrimary: img[1] === 'Y',
        displayOrder: img[2]
      }));
      
      const bidStatus = row[23]; // BID_STATUS column
      const startTime = row[7];
      const endTime = row[8];
      const now = new Date();
      
      const product = {
        itemId: row[0],
        title: row[1],
        description: row[2],
        category: row[3],
        productType: row[4],
        startingPrice: row[5],
        currentPrice: row[6],
        startTime: startTime,
        endTime: endTime,
        registrationEnd: row[9],
        productStatus: row[10],
        seller: {
          id: row[11],
          name: row[21],      // FIXED: was row[18]
          profilePicture: row[22]  // FIXED: was row[19]
        },
        userBidInfo: {
          maxBid: row[12],
          totalBids: row[13],
          lastBidTime: row[14]
        },
        currentHighestBid: {
          amount: row[15],
          bidderId: row[16],
          bidderName: row[17]
        },
        winner: row[18] ? {    // FIXED: was row[20]
          userId: row[18],
          winningBid: row[19], // FIXED: was row[21]
          paymentStatus: row[20]  // FIXED: was row[22]
        } : null,
        bidStatus: bidStatus,
        images: images,
        // Helper properties
        isWinning: bidStatus === 'WINNING',
        isOutbid: bidStatus === 'OUTBID',
        hasWon: bidStatus === 'WON',
        hasLost: bidStatus === 'LOST',
        isPending: bidStatus === 'PENDING',
        isActive: new Date(startTime) <= now && new Date(endTime) > now,
        timeRemaining: new Date(endTime) > now ? new Date(endTime) - now : 0
      };
      
      products.push(product);
      
      // Update summary
      summary.total++;
      switch (bidStatus) {
        case 'WINNING':
          summary.winning++;
          break;
        case 'OUTBID':
          summary.outbid++;
          break;
        case 'WON':
          summary.won++;
          break;
        case 'LOST':
          summary.lost++;
          break;
        case 'PENDING':
          summary.pending++;
          break;
      }
    }

    console.log("Bidded products summary:", summary);
    console.log("Total bidded products:", products.length);
    
    return res.json({
      success: true,
      message: "Bidded products retrieved successfully",
      data: {
        products,
        summary
      }
    });
    
  } catch (error) {
    console.error("Get bidded products error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      message: "Failed to get bidded products",
      success: false,
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}


export async function getBiddedProductsFiltered(req, res) {
  let connection;
  
  try {
    const userId = req.user.ID;
    const { status, productType, sortBy } = req.query;
    
    // Build dynamic WHERE clause
    let whereConditions = ['p.PRODUCT_TYPE IN (\'AUCTION\', \'REGISTRATION\')'];
    
    if (productType) {
      whereConditions.push(`p.PRODUCT_TYPE = '${productType}'`);
    }
    
    // Build ORDER BY clause
    let orderBy = `
      CASE 
        WHEN p.END_TIME > SYSTIMESTAMP THEN 1
        ELSE 2
      END,
      p.END_TIME ASC
    `;
    
    if (sortBy === 'recent') {
      orderBy = 'user_bid.LAST_BID_TIME DESC';
    } else if (sortBy === 'ending_soon') {
      orderBy = 'p.END_TIME ASC';
    } else if (sortBy === 'highest_bid') {
      orderBy = 'user_bid.MAX_BID_AMOUNT DESC';
    }
    
    connection = await getConnection();
    
    const query = `
      SELECT 
        p.ITEM_ID,
        p.TITLE,
        p.DESCRIPTION,
        p.CATEGORY,
        p.PRODUCT_TYPE,
        p.STARTING_PRICE,
        p.CURRENT_PRICE,
        p.START_TIME,
        p.END_TIME,
        p.REGISTRATION_END,
        p.STATUS as PRODUCT_STATUS,
        p.SELLER_ID,
        user_bid.MAX_BID_AMOUNT as USER_MAX_BID,
        user_bid.TOTAL_BIDS as USER_TOTAL_BIDS,
        user_bid.LAST_BID_TIME,
        highest_bid.BID_AMOUNT as HIGHEST_BID_AMOUNT,
        highest_bid.USER_ID as HIGHEST_BIDDER_ID,
        highest_bid.BIDDER_NAME as HIGHEST_BIDDER_NAME,
        aw.USER_ID as WINNER_ID,
        aw.WINNING_BID,
        aw.PAYMENT_STATUS as WINNER_PAYMENT_STATUS,
        u.FIRST_NAME || ' ' || u.LAST_NAME as SELLER_NAME,
        u.PROFILE_PICTURE_URL as SELLER_PROFILE_PICTURE,
        CASE
          WHEN p.START_TIME > SYSTIMESTAMP THEN 'PENDING'
          WHEN p.END_TIME < SYSTIMESTAMP AND aw.USER_ID = :userId THEN 'WON'
          WHEN p.END_TIME < SYSTIMESTAMP AND (aw.USER_ID IS NULL OR aw.USER_ID != :userId) THEN 'LOST'
          WHEN p.START_TIME <= SYSTIMESTAMP 
            AND p.END_TIME > SYSTIMESTAMP 
            AND highest_bid.USER_ID = :userId THEN 'WINNING'
          WHEN p.START_TIME <= SYSTIMESTAMP 
            AND p.END_TIME > SYSTIMESTAMP 
            AND (highest_bid.USER_ID IS NULL OR highest_bid.USER_ID != :userId) THEN 'OUTBID'
          ELSE 'UNKNOWN'
        END as BID_STATUS
      FROM PRODUCTS p
      INNER JOIN (
        SELECT 
          b.ITEM_ID,
          MAX(b.BID_AMOUNT) as MAX_BID_AMOUNT,
          COUNT(*) as TOTAL_BIDS,
          MAX(b.CREATED_AT) as LAST_BID_TIME
        FROM BIDS b
        WHERE b.USER_ID = :userId
          AND b.BID_STATUS = 'ACTIVE'
        GROUP BY b.ITEM_ID
      ) user_bid ON p.ITEM_ID = user_bid.ITEM_ID
      LEFT JOIN (
        SELECT 
          b.ITEM_ID,
          b.BID_AMOUNT,
          b.USER_ID,
          u.FIRST_NAME || ' ' || u.LAST_NAME as BIDDER_NAME
        FROM BIDS b
        INNER JOIN USERS u ON b.USER_ID = u.ID
        WHERE b.BID_STATUS = 'ACTIVE'
          AND (b.ITEM_ID, b.BID_AMOUNT) IN (
            SELECT ITEM_ID, MAX(BID_AMOUNT)
            FROM BIDS
            WHERE BID_STATUS = 'ACTIVE'
            GROUP BY ITEM_ID
          )
      ) highest_bid ON p.ITEM_ID = highest_bid.ITEM_ID
      LEFT JOIN AUCTION_WINNERS aw ON p.ITEM_ID = aw.ITEM_ID
      LEFT JOIN USERS u ON p.SELLER_ID = u.ID
      WHERE ${whereConditions.join(' AND ')}
      ${status ? `HAVING BID_STATUS = '${status.toUpperCase()}'` : ''}
      ORDER BY ${orderBy}
    `;
    
    const result = await connection.execute(query, { userId });
    
    // Process results (same as above)
    const products = [];
    const summary = {
      total: 0,
      winning: 0,
      outbid: 0,
      won: 0,
      lost: 0,
      pending: 0
    };
    
    for (const row of result.rows) {
      const itemId = row[0];
      
      const imageQuery = `
        SELECT IMAGE_URL, IS_PRIMARY, DISPLAY_ORDER
        FROM PRODUCT_IMAGES
        WHERE ITEM_ID = :itemId
        ORDER BY 
          CASE WHEN IS_PRIMARY = 'Y' THEN 0 ELSE 1 END,
          DISPLAY_ORDER ASC
      `;
      
      const imageResult = await connection.execute(imageQuery, { itemId });
      const images = imageResult.rows.map(img => ({
        url: img[0],
        isPrimary: img[1] === 'Y',
        displayOrder: img[2]
      }));
      
      const bidStatus = row[23];
      
      const product = {
        itemId: row[0],
        title: row[1],
        description: row[2],
        category: row[3],
        productType: row[4],
        startingPrice: row[5],
        currentPrice: row[6],
        startTime: row[7],
        endTime: row[8],
        registrationEnd: row[9],
        productStatus: row[10],
        seller: {
          id: row[11],
          name: row[21],
          profilePicture: row[22]
        },
        userBidInfo: {
          maxBid: row[12],
          totalBids: row[13],
          lastBidTime: row[14]
        },
        currentHighestBid: {
          amount: row[15],
          bidderId: row[16],
          bidderName: row[17]
        },
        winner: row[18] ? {
          userId: row[18],
          winningBid: row[19],
          paymentStatus: row[20]
        } : null,
        bidStatus: bidStatus,
        images: images,
        isWinning: bidStatus === 'WINNING',
        isOutbid: bidStatus === 'OUTBID',
        hasWon: bidStatus === 'WON',
        hasLost: bidStatus === 'LOST',
        isPending: bidStatus === 'PENDING',
        isActive: row[7] <= new Date() && row[8] > new Date(),
        timeRemaining: row[8] > new Date() ? new Date(row[8]) - new Date() : 0
      };
      
      products.push(product);
      
      summary.total++;
      switch (bidStatus) {
        case 'WINNING':
          summary.winning++;
          break;
        case 'OUTBID':
          summary.outbid++;
          break;
        case 'WON':
          summary.won++;
          break;
        case 'LOST':
          summary.lost++;
          break;
        case 'PENDING':
          summary.pending++;
          break;
      }
    }
    
    return res.json({
      success: true,
      message: "Bidded products retrieved successfully",
      data: {
        products,
        summary
      }
    });
    
  } catch (error) {
    console.error("Get bidded products filtered error:", error);
    return res.status(500).json({
      message: "Failed to get bidded products",
      success: false,
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}
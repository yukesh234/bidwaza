import fs from "fs";
import {uploadImage,deleteImage} from "../Service/cloudinary.js";
import { getConnection } from "../Db/Db.js";
import oracledb from "oracledb";
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
  try {
    // Get pagination and filter params from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { category, product_type } = req.query;
    
    // Calculate offset
    const offset = (page - 1) * limit;

    connection = await getConnection();

    // Build dynamic WHERE clause for filters (NO SELLER_ID filter)
    let whereClause = '';
    const binds = { offset, limit };

    if (category) {
      whereClause = whereClause ? whereClause + ' AND' : 'WHERE';
      whereClause += ' p.CATEGORY = :category';
      binds.category = category;
    }

    if (product_type) {
      whereClause = whereClause ? whereClause + ' AND' : 'WHERE';
      whereClause += ' p.PRODUCT_TYPE = :productType';
      binds.productType = product_type;
    }

    // Main query with pagination and SELLER INFO joined
    const productsQuery = `
      SELECT 
        p.ITEM_ID,
        p.SELLER_ID,
        p.TITLE,
        TO_CHAR(p.DESCRIPTION) as DESCRIPTION,
        p.CATEGORY,
        p.STOCK,
        p.PRODUCT_TYPE,
        p.AMOUNT,
        p.CREATED_AT,
        u.FIRST_NAME || ' ' || u.LAST_NAME as SELLER_NAME,
        u.EMAIL as SELLER_EMAIL,
        u.PROFILE_PICTURE_URL as SELLER_PROFILE_PICTURE
      FROM products p
      LEFT JOIN users u ON p.SELLER_ID = u.ID
      ${whereClause}
      ORDER BY p.CREATED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    // Count query for total records
    const countQuery = `
      SELECT COUNT(*) as TOTAL_COUNT
      FROM products p
      ${whereClause}
    `;

    // Execute both queries in parallel
    const [productsResult, countResult] = await Promise.all([
      connection.execute(productsQuery, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      connection.execute(countQuery, 
        { ...(category && { category }), ...(product_type && { productType: product_type }) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )
    ]);

    const totalCount = countResult.rows[0]?.TOTAL_COUNT || 0;

    console.log('=== ALL PRODUCTS PAGINATION INFO ===');
    console.log('Page:', page);
    console.log('Limit:', limit);
    console.log('Offset:', offset);
    console.log('Total Count:', totalCount);
    console.log('Rows returned:', productsResult.rows.length);

    // Get images for each product
    const productsWithImagesAndSeller = await Promise.all(
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
            seller: {
              sellerId: product.SELLER_ID,
              name: product.SELLER_NAME,
              email: product.SELLER_EMAIL,
              profilePicture: product.SELLER_PROFILE_PICTURE
            },
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
            seller: {
              sellerId: product.SELLER_ID,
              name: product.SELLER_NAME,
              email: product.SELLER_EMAIL,
              phone: product.SELLER_PHONE,
              companyName: product.COMPANY_NAME,
              profilePicture: product.SELLER_PROFILE_PICTURE
            },
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
        products: productsWithImagesAndSeller,
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
    console.error('Get all products error:', error);
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
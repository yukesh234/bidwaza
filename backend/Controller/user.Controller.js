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

 
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      userId = decoded.id;
      console.log(userId)
    }
  } catch (err) {
    console.log( "No valid token, showing public products.");
  }

  try {
    // Pagination and filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { category, product_type } = req.query;

    const offset = (page - 1) * limit;

    connection = await getConnection();

    // 🔹 Dynamic WHERE clause
    let whereClause = "";
    const binds = { offset, limit };

    if (category) {
      whereClause += (whereClause ? " AND" : " WHERE") + " p.CATEGORY = :category";
      binds.category = category;
    }

    if (product_type) {
      whereClause += (whereClause ? " AND" : " WHERE") + " p.PRODUCT_TYPE = :productType";
      binds.productType = product_type;
    }

    if (userId) {
      whereClause += (whereClause ? " AND" : " WHERE") + " p.SELLER_ID != :userId";
      binds.userId = userId;
    }

    
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
        u.FIRST_NAME || ' ' || u.LAST_NAME AS SELLER_NAME,
        u.EMAIL AS SELLER_EMAIL,
        u.PROFILE_PICTURE_URL AS SELLER_PROFILE_PICTURE
      FROM products p
      LEFT JOIN users u ON p.SELLER_ID = u.ID
      ${whereClause}
      ORDER BY p.CREATED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    // 🔹 Count query (no offset/limit)
    const countQuery = `
      SELECT COUNT(*) AS TOTAL_COUNT
      FROM products p
      ${whereClause}
    `;

    // ✅ Separate binds for count query (remove offset/limit)
    const countBinds = { ...binds };
    delete countBinds.offset;
    delete countBinds.limit;

    // Execute both queries in parallel
    const [productsResult, countResult] = await Promise.all([
      connection.execute(productsQuery, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      connection.execute(countQuery, countBinds, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
    ]);

    const totalCount = countResult.rows[0]?.TOTAL_COUNT || 0;

    // 🔹 Fetch images for each product
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
            profilePicture: product.SELLER_PROFILE_PICTURE,
          },
          images: imagesResult.rows.map((img) => ({
            url: img.IMAGE_URL,
            isPrimary: img.IS_PRIMARY === "Y",
            displayOrder: img.DISPLAY_ORDER,
          })),
        };
      })
    );

    // 🔹 Pagination details
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
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
    console.error("Get all products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
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


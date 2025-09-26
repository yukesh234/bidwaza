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

    const productImagesURL = uploadResults.map(result => {
      if (!result?.secure_url) {
        throw new Error("Image upload failed");
      }
      return result.secure_url;
    });

    // Get DB connection
    connection = await getConnection();

    // Insert product
    const productResult = await connection.execute(
      `INSERT INTO products (
         ITEM_ID, SELLER_ID, TITLE, DESCRIPTION, CATEGORY, STOCK, PRODUCT_TYPE, AMOUNT
       ) VALUES (
         product_seq.NEXTVAL, :sellerId, :title, :description, :category, :stock, :type, :amount
       ) RETURNING ITEM_ID INTO :itemId`,
      {
        sellerId: req.user.ID,
        title,
        description,
        category,
        stock: parseInt(stock) || 1,
        type: product_type,
        amount: parseFloat(amount),
        itemId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

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
  { autoCommit: true }
);

    }

    // Commit transaction
    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: {
        itemId,
        title,
        category,
        product_type,
        amount,
        images: productImagesURL
      }
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
      message: "Failed to add product", 
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

export { addProduct };
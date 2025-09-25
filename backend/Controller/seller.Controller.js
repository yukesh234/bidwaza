import { getConnection } from '../Db/db.js';
import fs from 'fs';
import uploadImage from '../Service/cloudinary.js';
import oracledb from 'oracledb';

async function addProduct(req, res) {
  let connection;
  try {
    const { title, description, price, auction_type } = req.body;
    const seller_id = req.user.ID; // From JWT middleware
    const files = req.files;

    if (!title || !price || !auction_type) {
      return res.status(400).json({
        success: false,
        message: 'Title, price, and auction type are required'
      });
    }

    if (!['fixed', 'direct', 'timed'].includes(auction_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid auction type'
      });
    }

    connection = await getConnection();

    // Insert product
    const productQuery = `
      INSERT INTO products (seller_id, title, description, price, auction_type, status) 
      VALUES (:seller_id, :title, :description, :price, :auction_type, 'active')
      RETURNING item_id INTO :item_id
    `;

    const productResult = await connection.execute(productQuery, {
      seller_id,
      title,
      description,
      price,
      auction_type,
      item_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    });

    const item_id = productResult.outBinds.item_id[0];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    // Insert images
    const imageQuery = `
      INSERT INTO product_images (item_id, image_url, is_primary, display_order) 
      VALUES (:item_id, :image_url, :is_primary, :display_order)
    `;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filepath = file.path;

      const response = await uploadImage(filepath);
      const imageUrl = response.secure_url;

      await connection.execute(imageQuery, {
        item_id,
        image_url: imageUrl,
        is_primary: i === 0 ? 'Y' : 'N',   // First image is primary
        display_order: i + 1
      });

      if (fs.existsSync(filepath)) fs.unlinkSync(filepath); // Clean local file
    }

    await connection.commit(); // Commit once after everything succeeds

    res.json({
      success: true,
      item_id,
      message: 'Product added successfully'
    });

  }  catch (error) {
    console.error("Add Product error:", error);

    // 🧹 Cleanup all uploaded files
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            try {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (cleanupErr) {
                console.error("File cleanup error:", cleanupErr);
            }
        }
    }

    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: "Internal server error" });
}
}
export { addProduct };

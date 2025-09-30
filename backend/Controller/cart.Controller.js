import {getConnection} from '../Db/Db.js'
import oracledb from 'oracledb'

export async function addtocart (req,res) {
   let connection;
   try {
    const {itemId, quantity = 1} = req.body;
    const UserId = req.user.ID;
    
    if(!itemId) {
        return res.status(400).json({
            success:false,
            message:"Item is required"
        });
    }

    if(quantity < 1) {
        return res.status(400).json({
            success:false,
            message:"Quantity should be greater or equals to 1"
        });
    }

    connection = await getConnection();
    
    const productCheck = await connection.execute(
      `SELECT STOCK, AMOUNT, TITLE FROM products WHERE ITEM_ID = :itemId`,
      { itemId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const product = productCheck.rows[0];

    if(product.STOCK < quantity) {
        return res.status(400).json({
            success:false,
            message:`Only ${product.STOCK} can be added`
        });
    }
    
    // Check if item already exists in cart
    const existingItem = await connection.execute(
      `SELECT CART_ITEM_ID, QUANTITY FROM cart_items 
       WHERE USER_ID = :UserId AND ITEM_ID = :itemId`,
      { UserId, itemId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existingItem.rows.length > 0) {
      // Update existing cart item
      const newQuantity = existingItem.rows[0].QUANTITY + quantity;

      if (newQuantity > product.STOCK) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.STOCK} items available in stock`
        });
      }

      await connection.execute(
        `UPDATE cart_items 
         SET QUANTITY = :quantity, ADDED_AT = CURRENT_TIMESTAMP
         WHERE CART_ITEM_ID = :cartItemId`,
        { 
          quantity: newQuantity, 
          cartItemId: existingItem.rows[0].CART_ITEM_ID 
        },
        { autoCommit: true }
      );

      return res.status(200).json({
        success: true,
        message: "Cart updated successfully",
        data: {
          cartItemId: existingItem.rows[0].CART_ITEM_ID,
          quantity: newQuantity,
          productTitle: product.TITLE
        }
      });
    } else {
      // Insert new cart item
      const result = await connection.execute(
        `INSERT INTO cart_items (USER_ID, ITEM_ID, QUANTITY)
         VALUES (:UserId, :itemId, :quantity)
         RETURNING CART_ITEM_ID INTO :cartItemId`,
        {
          UserId,
          itemId,
          quantity,
          cartItemId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        { autoCommit: true }
      );

      return res.status(201).json({
        success: true,
        message: "Item added to cart successfully",
        data: {
          cartItemId: result.outBinds.cartItemId[0],
          quantity,
          productTitle: product.TITLE
        }
      });
    }
    
   } catch (error) {
     console.error('Add to cart error:', error);
     res.status(500).json({
       success: false,
       message: "Failed to add item to cart",
       error: error.message
     });
   } finally {
     if(connection) {
       try {
         await connection.close();
       } catch(err) {
         console.error('Connection close error:', err);
       }
     }
   }
}




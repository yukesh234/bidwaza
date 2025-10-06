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

export async function getCart(req, res) {
  let connection;
  try {
    const userId = req.user.ID;

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT 
        c.CART_ITEM_ID,
        c.ITEM_ID,
        c.QUANTITY,
        c.ADDED_AT,
        p.TITLE,
        TO_CHAR(p.DESCRIPTION) as DESCRIPTION,
        p.AMOUNT,
        p.STOCK,
        p.CATEGORY,
        p.PRODUCT_TYPE,
        p.SELLER_ID,
        u.FIRST_NAME || ' ' || u.LAST_NAME as SELLER_NAME
      FROM cart_items c
      INNER JOIN products p ON c.ITEM_ID = p.ITEM_ID
      LEFT JOIN users u ON p.SELLER_ID = u.ID
      WHERE c.USER_ID = :userId
      ORDER BY c.ADDED_AT DESC`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Get images for each product
    const cartItems = await Promise.all(
      result.rows.map(async (item) => {
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
            cartItemId: item.CART_ITEM_ID,
            itemId: item.ITEM_ID,
            title: item.TITLE,
            description: item.DESCRIPTION,
            price: item.AMOUNT,
            quantity: item.QUANTITY,
            stock: item.STOCK,
            category: item.CATEGORY,
            productType: item.PRODUCT_TYPE,
            subtotal: item.AMOUNT * item.QUANTITY,
            addedAt: item.ADDED_AT,
            primaryImage: primaryImage,
            seller: {
              sellerId: item.SELLER_ID,
              name: item.SELLER_NAME
            }
          };
        } catch (imageError) {
          console.error('Error fetching images for item:', item.ITEM_ID, imageError);
          return {
            cartItemId: item.CART_ITEM_ID,
            itemId: item.ITEM_ID,
            title: item.TITLE,
            description: item.DESCRIPTION,
            price: item.AMOUNT,
            quantity: item.QUANTITY,
            stock: item.STOCK,
            category: item.CATEGORY,
            productType: item.PRODUCT_TYPE,
            subtotal: item.AMOUNT * item.QUANTITY,
            addedAt: item.ADDED_AT,
            primaryImage: null,
            seller: {
              sellerId: item.SELLER_ID,
              name: item.SELLER_NAME
            }
          };
        }
      })
    );

    // Calculate totals
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: {
        items: cartItems,
        summary: {
          totalItems,
          totalAmount,
          itemCount: cartItems.length
        }
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
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


export async function removefromcart(req,res) {
    let connection;
    const userId = req.user.ID;
    const {cartItemId} = req.params;
    try {
        connection = await getConnection();
        const result = await connection.execute(`DELETE FROM cart_items 
            where CART_ITEM_ID = :cartitemid and USER_ID =:userId`,
        {
            cartItemId,
            userId
        },
    {
        autoCommit:true
    })

    if(result.rowsAffected == 0)
    {
        return res.status(400).json(
         {  
            success:false,
            message:"product doesnt exists in the cart"
          });
    }
     res.status(200).json({
      success: true,
      message: "Item removed from cart successfully"
    });
    } catch (error) {
        console.error('Remove from cart error:', error);
     res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message
     })
}
finally{
    if(connection) await connection.close();
}
}

export async function clearCart(req, res) {
  const userId = req.user.ID;
  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(  // FIXED: Added await
      `DELETE FROM cart_items WHERE USER_ID = :userId`,  // FIXED: Removed space in :userId
      { userId },
      { autoCommit: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: {
        itemsRemoved: result.rowsAffected
      }
    });
    
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
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

export async function updateCartItemQuantity(req, res) {
  let connection;
  try {
    const { cartItemId} = req.params;
    const { quantity } = req.body;
    const userId = req.user.ID;
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }
    connection = await getConnection();
    //check if cart item exists and belongs to user
    const cartItemCheck = await connection.execute(
      `SELECT ITEM_ID FROM cart_items WHERE CART_ITEM_ID = :cartItemId AND USER_ID = :userId`,
      { cartItemId, userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (cartItemCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });
    }
    const itemId = cartItemCheck.rows[0].ITEM_ID;
    //check stock
    const productCheck = await connection.execute(
      `SELECT STOCK FROM products WHERE ITEM_ID = :itemId`,
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
    if (product.STOCK < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.STOCK} items available in stock`
      });
    }
    //update quantity
    await connection.execute(
      `UPDATE cart_items SET QUANTITY = :quantity, ADDED_AT = CURRENT_TIMESTAMP WHERE CART_ITEM_ID = :cartItemId`,
      { quantity, cartItemId },
      { autoCommit: true }
    );
    res.status(200).json({
      success: true,
      message: "Cart item quantity updated successfully",
      data: {
        cartItemId,
        quantity
      }
    });

  } catch (error) {
    console.error('Update cart item quantity error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart item quantity",
      error: error.message
    });
  }
}
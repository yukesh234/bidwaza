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

    // Since uploadImage returns the URL directly as a string, we just need to filter out any null/undefined values
    const productImagesURL = uploadResults.filter(url => url && typeof url === 'string');

    if (productImagesURL.length === 0) {
      throw new Error("No valid image URLs received from upload");
    }

    console.log('Valid image URLs:', productImagesURL);

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
        CREATED_AT
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



export { addProduct, getSellerProducts };
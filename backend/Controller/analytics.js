import {getConnection} from '../Db/Db.js'
import oracledb from 'oracledb';


// Get sales for custom number of days
const getSalesLastNDays = async (req, res) => {
  let connection;
  const days = parseInt(req.query.days) || 7;
  
  if (days < 1 || days > 365) {
    return res.status(400).json({
      success: false,
      message: 'Days must be between 1 and 365'
    });
  }
  
  try {
    connection = await getConnection();
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const dailySalesQuery = `
      SELECT 
        TO_CHAR(sale_date, 'YYYY-MM-DD') as day,
        COALESCE(SUM(amount), 0) as sales
      FROM (
        -- Regular orders
        SELECT 
          TRUNC(o.ORDER_DATE) as sale_date,
          o.TOTAL_AMOUNT as amount
        FROM ORDERS o
        WHERE o.ORDER_STATUS = 'COMPLETED'
          AND o.PAYMENT_STATUS = 'PAID'
          AND o.ORDER_DATE >= :startDate
          AND o.ORDER_DATE <= :endDate
        
        UNION ALL
        
        -- Auction winners
        SELECT 
          TRUNC(aw.PAYMENT_DATE) as sale_date,
          aw.WINNING_BID as amount
        FROM AUCTION_WINNERS aw
        WHERE aw.PAYMENT_STATUS = 'PAID'
          AND aw.PAYMENT_DATE >= :startDate
          AND aw.PAYMENT_DATE <= :endDate
      )
      GROUP BY TRUNC(sale_date), TO_CHAR(sale_date, 'YYYY-MM-DD')
      ORDER BY sale_date DESC
    `;
    
    const result = await connection.execute(dailySalesQuery, {
      startDate: startDate,
      endDate: endDate
    });
    
    const salesData = {};
    result.rows.forEach(row => {
      const day = row[0];
      const sales = parseFloat(row[1]) || 0;
      salesData[day] = sales;
    });
    
    res.status(200).json({
      success: true,
      message: `Sales data for the last ${days} days retrieved successfully`,
      data: salesData
    });
    
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales data',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
};

// Get seller-specific sales for last 7 days
// const getSellerSalesLast7Days = async (req, res) => {
//   let connection;
//   const sellerId = req.user.ID;
  
//   try {
//     connection = await getConnection();
    
//     const endDate = new Date();
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - 7);
    
//     const sellerDailySalesQuery = `
//       SELECT 
//         TO_CHAR(sale_date, 'YYYY-MM-DD') as day,
//         COALESCE(SUM(amount), 0) as sales
//       FROM (
//         -- Regular orders (Direct Sell)
//         SELECT 
//           TRUNC(o.ORDER_DATE) as sale_date,
//           oi.SUBTOTAL as amount
//         FROM ORDER_ITEMS oi
//         JOIN ORDERS o ON oi.ORDER_ID = o.ORDER_ID
//         WHERE oi.SELLER_ID = :sellerId
//           AND o.ORDER_STATUS = 'COMPLETED'
//           AND o.PAYMENT_STATUS = 'PAID'
//           AND TRUNC(o.ORDER_DATE) >= TRUNC(:startDate)
//           AND TRUNC(o.ORDER_DATE) <= TRUNC(:endDate)
        
//         UNION ALL
        
//         -- Auction winners
//         SELECT 
//           TRUNC(aw.PAYMENT_DATE) as sale_date,
//           aw.WINNING_BID as amount
//         FROM AUCTION_WINNERS aw
//         JOIN PRODUCTS p ON aw.ITEM_ID = p.ITEM_ID
//         WHERE p.SELLER_ID = :sellerId
//           AND aw.PAYMENT_STATUS = 'PAID'
//           AND TRUNC(aw.PAYMENT_DATE) >= TRUNC(:startDate)
//           AND TRUNC(aw.PAYMENT_DATE) <= TRUNC(:endDate)
//       )
//       GROUP BY sale_date, TO_CHAR(sale_date, 'YYYY-MM-DD')
//       ORDER BY sale_date ASC
//     `;
    
//     const result = await connection.execute(sellerDailySalesQuery, {
//       sellerId: sellerId,
//       startDate: startDate,
//       endDate: endDate
//     }, {
//       outFormat: oracledb.OUT_FORMAT_OBJECT
//     });
    
//     // Create array of last 7 days with 0 sales as default
//     const salesArray = [];
//     for (let i = 6; i >= 0; i--) {
//       const date = new Date();
//       date.setDate(date.getDate() - i);
//       const dateStr = date.toISOString().split('T')[0];
//       salesArray.push({
//         date: dateStr,
//         day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//         sales: 0
//       });
//     }
    
//     // Fill in actual sales data
//     result.rows.forEach(row => {
//       const dayStr = row.DAY;
//       const sales = parseFloat(row.SALES) || 0;
      
//       const matchingDay = salesArray.find(d => d.date === dayStr);
//       if (matchingDay) {
//         matchingDay.sales = sales;
//       }
//     });
    
//     // Calculate total and growth
//     const totalSales = salesArray.reduce((sum, day) => sum + day.sales, 0);
//     const last3Days = salesArray.slice(-3).reduce((sum, day) => sum + day.sales, 0);
//     const previous3Days = salesArray.slice(-6, -3).reduce((sum, day) => sum + day.sales, 0);
//     const growth = previous3Days > 0 
//       ? ((last3Days - previous3Days) / previous3Days * 100).toFixed(1)
//       : 0;
    
//     res.status(200).json({
//       success: true,
//       message: `Sales data for seller ${sellerId} for the last 7 days retrieved successfully`,
//       data: {
//         dailySales: salesArray,
//         totalSales: totalSales,
//         growth: parseFloat(growth)
//       }
//     });
    
//   } catch (error) {
//     console.error('Error fetching seller sales data:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch seller sales data',
//       error: error.message
//     });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (err) {
//         console.error('Error closing connection:', err);
//       }
//     }
//   }
// };
const getSellerSalesLast7Days = async (req, res) => {
  let connection;
  const sellerId = req.user.ID;
  
  try {
    connection = await getConnection();
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const sellerDailySalesQuery = `
      SELECT 
        TO_CHAR(sale_date, 'YYYY-MM-DD') as day,
        COALESCE(SUM(amount), 0) as sales
      FROM (
        -- Regular orders (Direct Sell)
        SELECT 
          TRUNC(o.ORDER_DATE) as sale_date,
          oi.SUBTOTAL as amount
        FROM ORDER_ITEMS oi
        JOIN ORDERS o ON oi.ORDER_ID = o.ORDER_ID
        WHERE oi.SELLER_ID = :sellerId
          AND o.ORDER_STATUS = 'COMPLETED'
          AND o.PAYMENT_STATUS = 'PAID'
          AND TRUNC(o.ORDER_DATE) >= TRUNC(:startDate)
          AND TRUNC(o.ORDER_DATE) <= TRUNC(:endDate)
        
        UNION ALL
        
        -- Auction winners
        SELECT 
          TRUNC(aw.PAYMENT_DATE) as sale_date,
          aw.WINNING_BID as amount
        FROM AUCTION_WINNERS aw
        JOIN PRODUCTS p ON aw.ITEM_ID = p.ITEM_ID
        WHERE p.SELLER_ID = :sellerId
          AND aw.PAYMENT_STATUS = 'PAID'
          AND TRUNC(aw.PAYMENT_DATE) >= TRUNC(:startDate)
          AND TRUNC(aw.PAYMENT_DATE) <= TRUNC(:endDate)
      )
      GROUP BY sale_date, TO_CHAR(sale_date, 'YYYY-MM-DD')
      ORDER BY sale_date ASC
    `;
    
    const result = await connection.execute(
      sellerDailySalesQuery,
      { sellerId, startDate, endDate },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Create array of last 7 days with 0 sales default
    const salesArray = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      salesArray.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: 0
      });
    }
    
    // Fill in actual database sales
    result.rows.forEach(row => {
      const matchingDay = salesArray.find(d => d.date === row.DAY);
      if (matchingDay) {
        matchingDay.sales = parseFloat(row.SALES) || 0;
      }
    });
    
    // Calculate totals
    const totalSales = salesArray.reduce((sum, day) => sum + day.sales, 0);
    const last3Days = salesArray.slice(-3).reduce((sum, day) => sum + day.sales, 0);
    const previous3Days = salesArray.slice(-6, -3).reduce((sum, day) => sum + day.sales, 0);
    
    // --- Fixed Growth Logic ---
    let growth;
    
    if (previous3Days === 0) {
      if (last3Days === 0) {
        growth = 0; // no sales in both windows
      } else {
        growth = 100; // went from 0 → something = full growth
      }
    } else {
      growth = ((last3Days - previous3Days) / previous3Days * 100).toFixed(1);
      growth = parseFloat(growth);
    }
    // --------------------------
    
    res.status(200).json({
      success: true,
      message: `Sales data for seller ${sellerId} for the last 7 days retrieved successfully`,
      data: {
        dailySales: salesArray,
        totalSales,
        growth
      }
    });
    
  } catch (error) {
    console.error('Error fetching seller sales data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller sales data',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
};

export async function getMonthlySales(req, res) {
  let connection;
  try {
    const sellerId = req.user.ID;
    const { timeRange = '6months' } = req.query;

    // Calculate months based on timeRange
    const monthsMap = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '1year': 12
    };
    const months = monthsMap[timeRange] || 6;

    connection = await getConnection();

    // Get monthly sales data with zero filling
    const salesQuery = `
      WITH month_range AS (
        SELECT 
          ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -LEVEL + 1) AS month_date
        FROM DUAL
        CONNECT BY LEVEL <= :months
      ),
      monthly_data AS (
        SELECT 
          TO_CHAR(o.ORDER_DATE, 'Mon') AS month,
          TO_CHAR(o.ORDER_DATE, 'YYYY-MM') AS month_key,
          COUNT(DISTINCT o.ORDER_ID) AS orders,
          NVL(SUM(oi.SUBTOTAL), 0) AS revenue
        FROM orders o
        INNER JOIN order_items oi ON o.ORDER_ID = oi.ORDER_ID
        WHERE oi.SELLER_ID = :sellerId
          AND o.ORDER_STATUS = 'COMPLETED'
          AND o.ORDER_DATE >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -:months)
        GROUP BY TO_CHAR(o.ORDER_DATE, 'Mon'), TO_CHAR(o.ORDER_DATE, 'YYYY-MM')
      )
      SELECT 
        TO_CHAR(mr.month_date, 'Mon') AS month,
        TO_CHAR(mr.month_date, 'YYYY-MM') AS month_key,
        NVL(md.orders, 0) AS orders,
        NVL(md.revenue, 0) AS revenue
      FROM month_range mr
      LEFT JOIN monthly_data md ON TO_CHAR(mr.month_date, 'YYYY-MM') = md.month_key
      ORDER BY mr.month_date
    `;

    const result = await connection.execute(
      salesQuery,
      { sellerId, months },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const salesData = result.rows.map(row => ({
      month: row.MONTH,
      revenue: parseFloat(row.REVENUE) || 0,
      orders: parseInt(row.ORDERS) || 0
    }));

    res.status(200).json({
      success: true,
      message: "Monthly sales data fetched successfully",
      data: salesData
    });

  } catch (error) {
    console.error('Get monthly sales error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly sales",
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

// export async function getProductPerformance(req, res) {
//   let connection;
//   try {
//     const sellerId = req.user.ID;
//     const { timeRange = '6months' } = req.query;

//     const monthsMap = {
//       '1month': 1,
//       '3months': 3,
//       '6months': 6,
//       '1year': 12
//     };
//     const months = monthsMap[timeRange] || 6;

//     connection = await getConnection();

//     // Get top 5 products and their monthly sales
//     const topProductsQuery = `
//       SELECT DISTINCT p.ITEM_ID, p.TITLE
//       FROM products p
//       INNER JOIN order_items oi ON p.ITEM_ID = oi.ITEM_ID
//       INNER JOIN orders o ON oi.ORDER_ID = o.ORDER_ID
//       WHERE p.SELLER_ID = :sellerId
//         AND o.ORDER_STATUS = 'COMPLETED'
//         AND o.ORDER_DATE >= ADD_MONTHS(SYSDATE, -:months)
//       GROUP BY p.ITEM_ID, p.TITLE
//       ORDER BY SUM(oi.QUANTITY) DESC
//       FETCH FIRST 5 ROWS ONLY
//     `;

//     const topProductsResult = await connection.execute(
//       topProductsQuery,
//       { sellerId, months },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     const topProducts = topProductsResult.rows;

//     // Get monthly sales for each product
//     const performanceQuery = `
//       WITH month_range AS (
//         SELECT 
//           ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -LEVEL + 1) AS month_date
//         FROM DUAL
//         CONNECT BY LEVEL <= :months
//       )
//       SELECT 
//         TO_CHAR(mr.month_date, 'Mon') AS month,
//         p.TITLE AS product_name,
//         NVL(SUM(oi.QUANTITY), 0) AS quantity
//       FROM month_range mr
//       CROSS JOIN (
//         SELECT ITEM_ID, TITLE 
//         FROM products 
//         WHERE ITEM_ID IN (${topProducts.map((_, i) => `:prod${i}`).join(',')})
//       ) p
//       LEFT JOIN order_items oi ON p.ITEM_ID = oi.ITEM_ID
//       LEFT JOIN orders o ON oi.ORDER_ID = o.ORDER_ID 
//         AND o.ORDER_STATUS = 'COMPLETED'
//         AND TO_CHAR(o.ORDER_DATE, 'YYYY-MM') = TO_CHAR(mr.month_date, 'YYYY-MM')
//       GROUP BY mr.month_date, p.TITLE
//       ORDER BY mr.month_date, p.TITLE
//     `;

//     const binds = { months };
//     topProducts.forEach((prod, i) => {
//       binds[`prod${i}`] = prod.ITEM_ID;
//     });

//     const performanceResult = await connection.execute(
//       performanceQuery,
//       binds,
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     // Transform data to format needed by recharts
//     const monthlyData = {};
//     performanceResult.rows.forEach(row => {
//       const month = row.MONTH;
//       if (!monthlyData[month]) {
//         monthlyData[month] = { month };
//       }
//       monthlyData[month][row.PRODUCT_NAME] = parseInt(row.QUANTITY) || 0;
//     });

//     const productPerformanceData = Object.values(monthlyData);

//     res.status(200).json({
//       success: true,
//       message: "Product performance data fetched successfully",
//       data: productPerformanceData
//     });

//   } catch (error) {
//     console.error('Get product performance error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch product performance",
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


// export async function getProductPerformance(req, res) {
//   let connection;
//   try {
//     const sellerId = req.user.ID;
//     const { timeRange = '6months' } = req.query;

//     const monthsMap = {
//       '1month': 1,
//       '3months': 3,
//       '6months': 6,
//       '1year': 12
//     };
//     const months = monthsMap[timeRange] || 6;

//     connection = await getConnection();

//     // Get top 5 products and their monthly sales
//     const topProductsQuery = `
//       SELECT p.ITEM_ID, p.TITLE
//       FROM products p
//       INNER JOIN order_items oi ON p.ITEM_ID = oi.ITEM_ID
//       INNER JOIN orders o ON oi.ORDER_ID = o.ORDER_ID
//       WHERE p.SELLER_ID = :sellerId
//         AND o.ORDER_STATUS = 'COMPLETED'
//         AND o.ORDER_DATE >= ADD_MONTHS(SYSDATE, -:months)
//       GROUP BY p.ITEM_ID, p.TITLE
//       ORDER BY SUM(oi.QUANTITY) DESC
//       FETCH FIRST 5 ROWS ONLY
//     `;

//     const topProductsResult = await connection.execute(
//       topProductsQuery,
//       { sellerId, months },
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     const topProducts = topProductsResult.rows;

//     // Get monthly sales for each product
//     const performanceQuery = `
//       WITH month_range AS (
//         SELECT 
//           ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -LEVEL + 1) AS month_date,
//           LEVEL AS month_order
//         FROM DUAL
//         CONNECT BY LEVEL <= :months
//       ),
//       top_products_list AS (
//         SELECT ITEM_ID, TITLE 
//         FROM products 
//         WHERE ITEM_ID IN (${topProducts.map((_, i) => `:prod${i}`).join(',')})
//       ),
//       monthly_sales AS (
//         SELECT 
//           TO_CHAR(mr.month_date, 'Mon') AS month,
//           mr.month_order,
//           p.TITLE AS product_name,
//           NVL(SUM(oi.QUANTITY), 0) AS quantity
//         FROM month_range mr
//         CROSS JOIN top_products_list p
//         LEFT JOIN order_items oi ON p.ITEM_ID = oi.ITEM_ID
//         LEFT JOIN orders o ON oi.ORDER_ID = o.ORDER_ID 
//           AND o.ORDER_STATUS = 'COMPLETED'
//           AND TRUNC(o.ORDER_DATE, 'MM') = mr.month_date
//         GROUP BY mr.month_date, mr.month_order, p.TITLE
//       )
//       SELECT 
//         month,
//         product_name,
//         quantity
//       FROM monthly_sales
//       ORDER BY month_order, product_name
//     `;

//     const binds = { months };
//     topProducts.forEach((prod, i) => {
//       binds[`prod${i}`] = prod.ITEM_ID;
//     });

//     const performanceResult = await connection.execute(
//       performanceQuery,
//       binds,
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     // Transform data to format needed by recharts
//     const monthlyData = {};
//     performanceResult.rows.forEach(row => {
//       const month = row.MONTH;
//       if (!monthlyData[month]) {
//         monthlyData[month] = { month };
//       }
//       monthlyData[month][row.PRODUCT_NAME] = parseInt(row.QUANTITY) || 0;
//     });

//     const productPerformanceData = Object.values(monthlyData);

//     res.status(200).json({
//       success: true,
//       message: "Product performance data fetched successfully",
//       data: productPerformanceData
//     });

//   } catch (error) {
//     console.error('Get product performance error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch product performance",
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

export async function getProductPerformance(req, res) {
  let connection;
  try {
    const sellerId = req.user.ID;
    const { timeRange = '6months' } = req.query;

    const monthsMap = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '1year': 12
    };
    const months = monthsMap[timeRange] || 6;

    connection = await getConnection();

    // Get top 5 products by total sales
    const topProductsQuery = `
      SELECT p.ITEM_ID, p.TITLE
      FROM products p
      INNER JOIN order_items oi ON p.ITEM_ID = oi.ITEM_ID
      INNER JOIN orders o ON oi.ORDER_ID = o.ORDER_ID
      WHERE p.SELLER_ID = :sellerId
        AND o.ORDER_STATUS = 'COMPLETED'
        AND o.ORDER_DATE >= ADD_MONTHS(SYSDATE, -:months)
      GROUP BY p.ITEM_ID, p.TITLE
      ORDER BY SUM(oi.QUANTITY) DESC
      FETCH FIRST 5 ROWS ONLY
    `;

    const topProductsResult = await connection.execute(
      topProductsQuery,
      { sellerId, months },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const topProducts = topProductsResult.rows;

    if (topProducts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No product performance data available",
        data: []
      });
    }

    // Get monthly sales for each product - simple and clean
    const performanceQuery = `
      WITH month_range AS (
        SELECT 
          ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -LEVEL + 1) AS month_date
        FROM DUAL
        CONNECT BY LEVEL <= :months
        ORDER BY 1
      )
      SELECT 
        TO_CHAR(mr.month_date, 'Mon') AS month,
        p.TITLE AS product_name,
        COALESCE(SUM(oi.QUANTITY), 0) AS quantity
      FROM month_range mr
      CROSS JOIN (
        SELECT ITEM_ID, TITLE 
        FROM products 
        WHERE ITEM_ID IN (${topProducts.map((_, i) => `:prod${i}`).join(',')})
      ) p
      LEFT JOIN orders o ON TRUNC(o.ORDER_DATE, 'MM') = mr.month_date
        AND o.ORDER_STATUS = 'COMPLETED'
      LEFT JOIN order_items oi ON o.ORDER_ID = oi.ORDER_ID 
        AND oi.ITEM_ID = p.ITEM_ID
      GROUP BY mr.month_date, p.TITLE
      ORDER BY mr.month_date, p.TITLE
    `;

    const binds = { months };
    topProducts.forEach((prod, i) => {
      binds[`prod${i}`] = prod.ITEM_ID;
    });

    const performanceResult = await connection.execute(
      performanceQuery,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Transform data to format needed by recharts
    const monthlyData = {};
    performanceResult.rows.forEach(row => {
      const month = row.MONTH;
      if (!monthlyData[month]) {
        monthlyData[month] = { month };
      }
      monthlyData[month][row.PRODUCT_NAME] = parseInt(row.QUANTITY) || 0;
    });

    const productPerformanceData = Object.values(monthlyData);

    res.status(200).json({
      success: true,
      message: "Product performance data fetched successfully",
      data: productPerformanceData
    });

  } catch (error) {
    console.error('Get product performance error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product performance",
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

export async function getCategoryRevenue(req, res) {
  let connection;
  try {
    const sellerId = req.user.ID;
    const { timeRange = '6months' } = req.query;

    const monthsMap = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '1year': 12
    };
    const months = monthsMap[timeRange] || 6;

    connection = await getConnection();

    const categoryQuery = `
      SELECT 
        p.CATEGORY AS name,
        NVL(SUM(oi.SUBTOTAL), 0) AS value
      FROM products p
      INNER JOIN order_items oi ON p.ITEM_ID = oi.ITEM_ID
      INNER JOIN orders o ON oi.ORDER_ID = o.ORDER_ID
      WHERE p.SELLER_ID = :sellerId
        AND o.ORDER_STATUS = 'COMPLETED'
        AND o.ORDER_DATE >= ADD_MONTHS(SYSDATE, -:months)
      GROUP BY p.CATEGORY
      ORDER BY value DESC
    `;

    const result = await connection.execute(
      categoryQuery,
      { sellerId, months },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const colors = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#6366f1'];
    const categoryData = result.rows.map((row, index) => ({
      name: row.NAME || 'Uncategorized',
      value: parseFloat(row.VALUE) || 0,
      color: colors[index % colors.length]
    }));

    res.status(200).json({
      success: true,
      message: "Category revenue data fetched successfully",
      data: categoryData
    });

  } catch (error) {
    console.error('Get category revenue error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category revenue",
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

export async function getTopProducts(req, res) {
  let connection;
  try {
    const sellerId = req.user.ID;
    const { timeRange = '6months' } = req.query;

    const monthsMap = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '1year': 12
    };
    const months = monthsMap[timeRange] || 6;

    connection = await getConnection();

    const topProductsQuery = `
      SELECT 
        p.TITLE AS name,
        SUM(oi.QUANTITY) AS quantity,
        SUM(oi.SUBTOTAL) AS revenue
      FROM products p
      INNER JOIN order_items oi ON p.ITEM_ID = oi.ITEM_ID
      INNER JOIN orders o ON oi.ORDER_ID = o.ORDER_ID
      WHERE p.SELLER_ID = :sellerId
        AND o.ORDER_STATUS = 'COMPLETED'
        AND o.ORDER_DATE >= ADD_MONTHS(SYSDATE, -:months)
      GROUP BY p.TITLE
      ORDER BY revenue DESC
      FETCH FIRST 5 ROWS ONLY
    `;

    const result = await connection.execute(
      topProductsQuery,
      { sellerId, months },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const topProducts = result.rows.map(row => ({
      name: row.NAME,
      quantity: parseInt(row.QUANTITY) || 0,
      revenue: parseFloat(row.REVENUE) || 0
    }));

    res.status(200).json({
      success: true,
      message: "Top products data fetched successfully",
      data: topProducts
    });

  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top products",
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

export async function getAuctionStats(req, res) {
  let connection;
  try {
    const sellerId = req.user.ID;
    const { timeRange = '6months' } = req.query;

    const monthsMap = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '1year': 12
    };
    const months = monthsMap[timeRange] || 6;

    connection = await getConnection();

    // Get auction statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT p.ITEM_ID) AS total_auctions,
        COUNT(DISTINCT aw.WINNER_ID) AS completed_auctions,
        COUNT(b.BID_ID) AS total_bids
      FROM products p
      LEFT JOIN auction_winners aw ON p.ITEM_ID = aw.ITEM_ID
      LEFT JOIN bids b ON p.ITEM_ID = b.ITEM_ID
      WHERE p.SELLER_ID = :sellerId
        AND p.PRODUCT_TYPE IN ('AUCTION', 'REGISTRATION')
        AND p.CREATED_AT >= ADD_MONTHS(SYSDATE, -:months)
    `;

    const statsResult = await connection.execute(
      statsQuery,
      { sellerId, months },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const stats = statsResult.rows[0];
    const totalAuctions = parseInt(stats.TOTAL_AUCTIONS) || 0;
    const completedAuctions = parseInt(stats.COMPLETED_AUCTIONS) || 0;
    const totalBids = parseInt(stats.TOTAL_BIDS) || 0;

    // Get bid activity by day
    const bidActivityQuery = `
      SELECT 
        TO_CHAR(b.CREATED_AT, 'Dy') AS day,
        TO_CHAR(b.CREATED_AT, 'HH24') AS hour,
        COUNT(*) AS bid_count
      FROM bids b
      INNER JOIN products p ON b.ITEM_ID = p.ITEM_ID
      WHERE p.SELLER_ID = :sellerId
        AND b.CREATED_AT >= ADD_MONTHS(SYSDATE, -:months)
      GROUP BY TO_CHAR(b.CREATED_AT, 'Dy'), TO_CHAR(b.CREATED_AT, 'HH24')
      ORDER BY 
        CASE TO_CHAR(b.CREATED_AT, 'Dy')
          WHEN 'Mon' THEN 1
          WHEN 'Tue' THEN 2
          WHEN 'Wed' THEN 3
          WHEN 'Thu' THEN 4
          WHEN 'Fri' THEN 5
          WHEN 'Sat' THEN 6
          WHEN 'Sun' THEN 7
        END
    `;

    const bidActivityResult = await connection.execute(
      bidActivityQuery,
      { sellerId, months },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Transform bid activity data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const timeSlots = ['9AM', '12PM', '3PM', '6PM', '9PM'];
    
    const bidActivity = days.map(day => {
      const dayData = { day };
      timeSlots.forEach(slot => {
        const hour = slot === '9AM' ? '09' : slot === '12PM' ? '12' : slot === '3PM' ? '15' : slot === '6PM' ? '18' : '21';
        const found = bidActivityResult.rows.find(row => row.DAY === day && row.HOUR === hour);
        dayData[slot] = found ? parseInt(found.BID_COUNT) : 0;
      });
      return dayData;
    });

    const auctionStats = {
      totalAuctions,
      completedAuctions,
      winRate: totalAuctions > 0 ? ((completedAuctions / totalAuctions) * 100).toFixed(1) : 0,
      avgBidsPerAuction: totalAuctions > 0 ? (totalBids / totalAuctions).toFixed(1) : 0,
      totalBids,
      bidActivity
    };

    res.status(200).json({
      success: true,
      message: "Auction statistics fetched successfully",
      data: auctionStats
    });

  } catch (error) {
    console.error('Get auction stats error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch auction statistics",
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
export {
    getSellerSalesLast7Days,
    getSalesLastNDays
}
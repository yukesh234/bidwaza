import { generateEsewaSignature } from "../Service/generateEsewaSIgnature.js";
import { getConnection } from '../Db/Db.js';
import axios from 'axios';
import oracledb from 'oracledb';
import crypto from 'crypto';

// ==================== /pay ====================
export async function pay(req, res) {
    try {
        console.log("Payment initiation request received:", req.body);
        const { amount, cartItems, productId, quantity } = req.body;
        
        if (!amount) return res.status(400).json({ message: "Amount is required" });
        
        // Support both single product and cart
        if (!cartItems && (!productId || !quantity)) {
            return res.status(400).json({ 
                message: "Either cartItems or (productId and quantity) is required" 
            });
        }

        const transaction_uuid = crypto.randomUUID();
        const { signature, signed_field_names } = generateEsewaSignature(amount, transaction_uuid);
        
        console.log("Generated eSewa signature:", signature);
        
        // IMPORTANT: eSewa needs BOTH 'amount' and 'total_amount' plus tax/charges
        res.json({
            esewaURL: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
            paymentData: {
                amount: amount,                    // Required by eSewa for display
                total_amount: amount,              // Used in signature calculation
                transaction_uuid,
                product_code: process.env.ESEWA_PRODUCT_CODE,
                product_service_charge: "0",
                product_delivery_charge: "0",
                tax_amount: "0",
                success_url: `${process.env.FRONTEND_URL}/esewa/success`,
                failure_url: `${process.env.FRONTEND_URL}/esewa/failure`,
                signature,
                signed_field_names
            },
        });
    } catch (error) {
        console.error("Payment initiation failed:", error);
        res.status(500).json({ message: "Payment initiation failed" });
    }
}

// ==================== /verify ====================
export async function verify(req, res) {
    let connection;
    try {
        const { amt, refId, cartItems, productId, quantity, userId,transaction_uuid } = req.body;

        if (!amt || !refId || !userId) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        console.log("Verification request received:", req.body);
        // Normalize input: convert single product to cart format
        let items = [];
        if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
            items = cartItems;
        } else if (productId && quantity) {
            items = [{ productId, quantity }];
        } else {
            return res.status(400).json({ 
                message: "Either cartItems or (productId and quantity) is required" 
            });
        }

        // Get transaction_uuid from request body
        // const transaction_uuid = req.body.transaction_uuid;
        
        if (!transaction_uuid) {
            return res.status(400).json({ message: "Transaction UUID is required for verification" });
        }
        
        // Verify with eSewa - GET request with query params
      const response = await axios.get(
    `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${process.env.ESEWA_PRODUCT_CODE}&total_amount=${amt}&transaction_uuid=${transaction_uuid}`)

        
        console.log("eSewa verification response:", response.data);
        console.log(Date.now().toFixed(0));

        if (!response.data.status) {
            return res.status(400).json({ message: "Transaction verification failed" });
        }

        connection = await getConnection();
        console.log("Database connection established");

        // Fetch all product details
        const productIds = items.map(item => item.productId);
        const placeholders = productIds.map((_, i) => `:id${i}`).join(',');
        const bindParams = {};
        productIds.forEach((id, i) => {
            bindParams[`id${i}`] = id;
        });

        const productResult = await connection.execute(
            `SELECT ITEM_ID, stock, title, amount, seller_id 
             FROM products 
             WHERE ITEM_ID IN (${placeholders})`,
            bindParams,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (productResult.rows.length !== items.length) {
            return res.status(404).json({ message: "Some products not found" });
        }

        // Create a map for easy lookup
        const productMap = {};
        productResult.rows.forEach(product => {
            productMap[product.ITEM_ID] = product;
        });

        // Validate stock for all items
        let calculatedTotal = 0;
        for (const item of items) {
            const product = productMap[item.productId];
            if (!product) {
                return res.status(404).json({ message: `Product ${item.productId} not found` });
            }
            if (product.STOCK < item.quantity) {
                return res.status(400).json({ 
                    message: `Not enough stock for ${product.TITLE}. Available: ${product.STOCK}` 
                });
            }
            calculatedTotal += product.AMOUNT * item.quantity;
        }

        // Verify the total amount matches
        if (Math.abs(calculatedTotal - parseFloat(amt)) > 0.01) {
            return res.status(400).json({ 
                message: "Amount mismatch. Please refresh and try again." 
            });
        }

        // Create order
        const orderResult = await connection.execute(
            `INSERT INTO orders (USER_ID, ORDER_NUMBER, TOTAL_AMOUNT, ORDER_STATUS, PAYMENT_STATUS, ESEWA_TXN_ID)
             VALUES (:userId, 'ORD-' || TO_CHAR(SYSDATE, 'YYYYMMDD') || '-' || order_number_seq.NEXTVAL, :total, 'PENDING', 'PAID', :txnId)
             RETURNING ORDER_ID INTO :orderId`,
            {
                userId,
                total: amt,
                txnId: refId,
                orderId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: false }
        );

        const orderId = orderResult.outBinds.orderId[0];

        // Insert all order items and update stock
        for (const item of items) {
            const product = productMap[item.productId];
            
            // Insert order item
            await connection.execute(
                `INSERT INTO order_items (ORDER_ID, ITEM_ID, SELLER_ID, PRODUCT_TITLE, PRICE_AT_PURCHASE, QUANTITY, SUBTOTAL)
                 VALUES (:orderId, :itemId, :sellerId, :title, :price, :quantity, :subtotal)`,
                {
                    orderId,
                    itemId: item.productId,
                    sellerId: product.SELLER_ID,
                    title: product.TITLE,
                    price: product.AMOUNT,
                    quantity: item.quantity,
                    subtotal: product.AMOUNT * item.quantity,
                },
                { autoCommit: false }
            );

            // Update stock
            await connection.execute(
                `UPDATE products SET stock = stock - :qty WHERE ITEM_ID = :id`,
                { qty: item.quantity, id: item.productId },
                { autoCommit: false }
            );
        }

        // Commit all changes
        await connection.commit();

        res.json({ 
            message: "Payment verified and order created successfully", 
            orderId,
            itemCount: items.length
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Error during rollback:", rollbackError);
            }
        }
        console.error("Payment verification failed:", error);
        res.status(500).json({ message: "Payment verification failed" });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                console.error("Error closing connection:", error);
            }
        }
    }
}
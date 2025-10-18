import crypto from 'crypto'
import {getConnection} from '../Db/Db.js'
import axios from 'axios'
import { generateEsewaSignature } from '../Service/generateEsewaSIgnature.js';
import oracledb from 'oracledb';

export async function pay(req,res) {
    const {amount} = req.body;
    console.log(req.body);
    try {
        if(!amount)
        {
            res.send(400).json({
                success:false,
                message:"Amount is required"
            })
        }

        const transaction_uuid = crypto.randomUUID();
        const { signature, signed_field_names } = generateEsewaSignature(amount,transaction_uuid);
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
                success_url: `${process.env.FRONTEND_URL}/wallet/success`,
                failure_url: `${process.env.FRONTEND_URL}/wallet/failure`,
                signature,
                signed_field_names
            },
        })
    } catch (error) {
          console.error("Payment initiation failed:", error);
        res.status(500).json({ message: "Payment initiation failed" });
    }
}

export async function verifyPayment(req, res) {
  let connection;
  try {
    const { data } = req.body;
    console.log("Entered verify - raw data:", data);

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Payment data is required"
      });
    }

    // DECODE THE DATA
    let decodedData;
    try {
      decodedData = JSON.parse(Buffer.from(data, 'base64').toString());
      console.log("Decoded data:", decodedData);
    } catch (error) {
      console.error("Failed to decode data:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid payment data format"
      });
    }

    // EXTRACT ALL FIELDS FROM DECODED DATA
    const {
      transaction_uuid,
      status,
      total_amount,
      product_code,
      signature
    } = decodedData;

    // Validate required fields
    if (!transaction_uuid || !status || !total_amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment fields"
      });
    }

    // Check payment status
    if (status !== "COMPLETE") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed"
      });
    }

    const userId = req.user?.ID || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    connection = await getConnection();

    // ✅ CHECK IF TRANSACTION ALREADY PROCESSED (MOVED BEFORE OTHER OPERATIONS)
    const existingTxResult = await connection.execute(
      `SELECT TRANSACTION_ID, AMOUNT FROM WALLET_TOPUP_HISTORY WHERE REFERENCE_ID = :refId`,
      { refId: transaction_uuid },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existingTxResult.rows && existingTxResult.rows.length > 0) {
      console.log("Transaction already processed:", transaction_uuid);
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        transaction_uuid,
        amount: existingTxResult.rows[0].AMOUNT,
        alreadyProcessed: true
      });
    }

    // Get existing wallet
    const walletResult = await connection.execute(
      `SELECT WALLET_ID FROM WALLETS WHERE USER_ID = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let walletId;

    if (!walletResult.rows || walletResult.rows.length === 0) {
      // Create wallet if it doesn't exist
      const createWalletResult = await connection.execute(
        `INSERT INTO WALLETS (USER_ID, BALANCE)
         VALUES (:userId, 0)
         RETURNING WALLET_ID INTO :walletId`,
        { 
          userId,
          walletId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        },
        { autoCommit: false }
      );
      walletId = createWalletResult.outBinds.walletId[0];
    } else {
      walletId = walletResult.rows[0].WALLET_ID;
    }

    // Insert transaction and update balance
    await connection.execute(
      `INSERT INTO WALLET_TOPUP_HISTORY 
       (WALLET_ID, AMOUNT, TRANSACTION_TYPE, PAYMENT_METHOD, STATUS, REFERENCE_ID)
       VALUES (:walletId, :amount, :type, :method, :status, :refId)`,
      {
        walletId,
        amount: total_amount,
        type: 'TOPUP',
        method: 'ESEWA',
        status: 'SUCCESS',
        refId: transaction_uuid
      },
      { autoCommit: false }
    );

    await connection.execute(
      `UPDATE WALLETS 
       SET BALANCE = BALANCE + :amount, LAST_UPDATED = CURRENT_TIMESTAMP
       WHERE WALLET_ID = :walletId`,
      {
        amount: total_amount,
        walletId
      },
      { autoCommit: false }
    );

    await connection.commit();
    console.log("Wallet updated successfully for user:", userId);

    res.json({
      success: true,
      message: "Payment verified and wallet updated",
      transaction_uuid,
      amount: total_amount
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        console.error("Rollback error:", e);
      }
    }
    console.error("Payment verification failed:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed: " + error.message
    });
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

export async function getHistory(req, res) {
  const userId = req.user.ID;
  let connection;
  
  try {
    connection = await getConnection();
    
    // Get wallet balance
    const walletResult = await connection.execute(
      `SELECT BALANCE FROM WALLETS WHERE USER_ID = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const balance = walletResult.rows?.[0]?.BALANCE || 0;

    // Get transaction history with all details
    const result = await connection.execute(
      `SELECT 
        a.TRANSACTION_ID,
        a.AMOUNT,
        a.TRANSACTION_TYPE,
        a.PAYMENT_METHOD,
        a.STATUS,
        a.REFERENCE_ID,
        a.CREATED_AT
      FROM WALLET_TOPUP_HISTORY a 
      JOIN WALLETS w ON a.WALLET_ID = w.WALLET_ID 
      WHERE w.USER_ID = :userId
      ORDER BY a.CREATED_AT DESC`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Return empty array instead of 404 if no transactions
    if (!result.rows || result.rows.length === 0) {
      return res.status(200).json({ 
        success: true,
        balance: balance,
        transactions: [],
        message: "No transactions found"
      });
    }

    res.status(200).json({
      success: true,
      balance: balance,
      transactions: result.rows, // Return all rows, not just first one
      message: "History fetched successfully"
    });

  } catch (error) {
    console.log("Get history error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    // Always close the connection
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Error closing connection:", error);
      }
    }
  }
}
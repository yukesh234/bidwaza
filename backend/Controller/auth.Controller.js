import express from 'express';
import bcrypt from 'bcryptjs';
import oracledb from 'oracledb';
import { getConnection } from '../Db/Db.js';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Import services
import { sendverificationCode as sendVerificationService, resendCode, verifyCode,verifyPasswordResetCode,sendPasswordResetCode,resendPasswordResetCode } from "../Service/emailService.js";
dotenv.config();


async function register(req, res) {
  const { firstname, lastName, email, password, interests } = req.body;
  
  // Input validation
  if (!firstname || !lastName || !email || !password) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  let connection;
  try {
    connection = await getConnection();

    // Check if user exists
    const checkQuery = `SELECT * FROM users WHERE email = :email`;
    const result = await connection.execute(checkQuery, { email }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
    if (result.rows.length > 0) {
      return res.status(400).send({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user and get ID
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, password, interests)
      VALUES (:first_name, :last_name, :email, :password, :interests)
      RETURNING id INTO :user_id
    `;
    
    const insertResult = await connection.execute(
      insertQuery,
      {
        first_name: firstname,
        last_name: lastName,
        email,
        password: hashedPassword,
        interests: JSON.stringify(interests),
        user_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    const userId = insertResult.outBinds.user_id[0];

    // Create wallet for the new user - use same connection
    await connection.execute(
      `INSERT INTO WALLETS (USER_ID, BALANCE)
       VALUES (:userId, 0)`,
      { userId },
      { autoCommit: true }
    );

    // Generate JWT
    const token = jwt.sign(
      { 
        userId,
        email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, { httpOnly: true });

    return res.status(201).send({
      message: 'User registered successfully',
      user: {
        userId,
        firstname,
        lastName,
        email,
        interests
      },
      success: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).send({
      message: 'Server error', 
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
}
async function login  (req, res)  {
  let connection; // Move this outside try block
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).send({ message: 'Email and password are required' });
    }
    
    connection = await getConnection();
    
    // Fetch users
    const result = await connection.execute(
      `SELECT id, first_name, last_name, email, password 
       FROM users 
       WHERE email = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(400).send({ message: "User not found" });
    }
    
    // Compare password - Use UPPERCASE
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.PASSWORD); // Changed to uppercase

    if (!isMatch) {
      return res.status(400).send({ message: "Invalid email or password" });
    }

    // Generate jwt
    const token = jwt.sign(
      {  id: user.ID,
        email: user.EMAIL },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, { httpOnly: true });

    return res.json({
      message: "Login successful",
      user: {
        id: user.ID,
        email: user.EMAIL,
        first_name: user.FIRST_NAME,
        last_name: user.LAST_NAME
      },
      "success":true
    });

  } catch (error) {
    console.error('Login error:', error); 
    return res.status(500).send({ message: "Internal server error" });
  } finally {
    // Close connection in finally block
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

function logout (req,res)
{
  res.clearCookie('token');
  res.status(200).send({message:"Logged out successfully"})
}

async function getCurrentUser(req, res) {
  let connection; // Add this
  const userId = req.user.ID;
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    connection = await getConnection(); // Move this after token check
    
    const result = await connection.execute(
      `SELECT id, first_name, last_name, email, interests, profile_picture_url FROM users WHERE email = :email`,
      { email: decoded.email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    //getting balance
        const amountresult = await connection.execute(
        `SELECT BALANCE FROM WALLETS WHERE USER_ID = :user_id`,
        { user_id: userId },
       
      );
      
    
    res.json({ user: result.rows[0], balance: amountresult.rows[0] });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  } finally {
    // Add this cleanup block
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}


async function sendVerificationCode(req, res) {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).send({ message: "Email is required", success: false });
    }
    const response = await sendVerificationService(email);
    return res.status(response.success ? 200 : 400).send(response);
  } catch (error) {
    res.status(500).send({ message: "Failed to send verification code", error: error.message, success: false });
  }
}

async function resendVerificationCode(req, res) {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).send({ message: "Email is required", success: false });
    }
    const response = await resendCode(email);
    return res.status(response.success ? 200 : 400).send(response);
  } catch (error) {
    res.status(500).send({ message: "Failed to resend verification code", error: error.message, success: false });
  }
}

async function verifyEmailCode(req, res) {
  const { email, code } = req.body;
  try {
    if (!email || !code) {
      return res.status(400).send({ message: "Email and code are required", success: false });
    }
    const response = await verifyCode(email, code);
    return res.status(response.success ? 200 : 400).send(response);
  } catch (error) {
    res.status(500).send({ message: "Failed to verify code", error: error.message, success: false });
  }
}

export async function updatePassword(req, res) {
  let connection;
  try {
    const { currentPassword, newpassword } = req.body;

    // Validate fields
    if ([currentPassword, newpassword].some((field) => !field || field.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Fields cannot be empty",
      });
    }

    const userId = req.user.ID;
    connection = await getConnection();

    // Fetch user
    const result = await connection.execute(
      `SELECT password FROM users WHERE id = :id`,
      { id: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(currentPassword, user.PASSWORD);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newpassword, 10);

    // Update DB
    await connection.execute(
      `UPDATE users SET password = :password WHERE id = :id`,
      { password: hashedPassword, id: userId },
      { autoCommit: true }
    );

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("update password error:", error);
    return res.status(500).json({
      success: false,
      message: "Error while changing the password",
    });
  } finally {
    if (connection) await connection.close();
  }
}


async function forgotPassword(req,res)
{
  let connection;
  try {
    const { email } = req.body;
    if(!email) return res.status(400).send({message:"Email is required", success:false});
    //check if email exists 
    connection = await getConnection();
    const result = await connection.execute(
      `select id from users where email = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT } 
    )

    if(result.rows.length === 0)
    {
      return  res.status(400).send({message:"Email not found", success:false});
    }


    const response = await sendPasswordResetCode(email);
    return res.status(response.success ? 200 : 400).send(response);
  } catch (error) {
     res.status(500).send({ message: "Failed to send password reset code", error: error.message, success: false });
  }
}

 async function resendPasswordResetCodeController(req,res){
  let connection;
  try {
    const { email } = req.body;
    if(!email) return res.status(400).send({message:"Email is required", success:false});
    const response = await resendPasswordResetCode(email);
    return res.status(response.success ? 200 : 400).send(response);
  } catch (error) {
    return res.status(500).send({ message: "Failed to resend password reset code", error: error.message, success: false });
  }
}

 async function verifyPasswordResetCodeController(req,res){
  let connection;
  try {
    const { email, code } = req.body;
    if(!email || !code) return res.status(400).send({message:"Email and code are required", success:false});
    const response = await verifyPasswordResetCode(email,code);
    return res.status(response.success ? 200 : 400).send(response);
  } catch (error) {
    return res.status(500).send({ message: "Failed to verify password reset code", error: error.message, success: false });
  }
}

 async function resetpassword(req,res)
{
  let connection;
  try {
    const {newpassword,email} = req.body;
    if(!newpassword || !email) return res.status(400).send({message:"Email and new password are required", success:false});
      
    
    connection = await getConnection();
    //hashing new password 
    const hashedPassword  = await bcrypt.hash(newpassword,10);
    //updating the password in the database 

    const result = await connection.execute(
      `update users set password = :Password where email =:email`,
      { Password: hashedPassword,email  },
      { autoCommit: true }
    )
    if(result.rowsAffected === 0)
    {
      return res.status(400).send({message:"User not found", success:false});
    }
    return res.status(200).send({message:"Password reset successfully", success:true});

  } catch (error) {
    console.log("reset password error:",error);
    return res.status(500).send({ message: "Error while resetting password", error: error.message, success: false });
  }
}



export default {
  register,
  login,
  logout,
  getCurrentUser,
  sendVerificationCode,
  resendVerificationCode,
  verifyEmailCode,
  updatePassword,
  forgotPassword,
  resendPasswordResetCodeController,
  verifyPasswordResetCodeController,
  resetpassword
};

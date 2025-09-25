import express from 'express';
import bcrypt from 'bcryptjs';
import oracledb from 'oracledb';
import { getConnection } from '../Db/db.js';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Import services
import { sendverificationCode as sendVerificationService, resendCode, verifyCode } from "../Service/emailService.js";
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

    // Check if user exists - using correct column name
    const checkQuery = `SELECT * FROM users WHERE email = :email`;
    const result = await connection.execute(checkQuery, { email }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
    if (result.rows.length > 0) {
      return res.status(400).send({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Method 1: Using RETURNING clause (Oracle specific)
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

    // Get the returned user ID
    const userId = insertResult.outBinds.user_id[0];

    // Generate JWT with user ID included
    const token = jwt.sign(
      { 
        userId,  // Include user ID in token
        email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.cookie('token', token, { httpOnly: true });

    return res.status(201).send({
      message: 'User registered successfully',
      user: {
        userId,        // 🎉 Here's your user ID!
        firstname,
        lastName,
        email,
        interests
      },
      "success": true
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
      {  id: user.user.ID,
        email: user.EMAIL },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
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
    
    res.json({ user: result.rows[0] });
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

export default {
  register,
  login,
  logout,
  getCurrentUser,
  sendVerificationCode,
  resendVerificationCode,
  verifyEmailCode,
};

import jwt from 'jsonwebtoken';
import oracledb from 'oracledb';
import { getConnection } from '../Db/db.js';

const authenticateToken = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details from database
        let connection = await getConnection();
        const result = await connection.execute(
            `SELECT id, email, first_name, last_name FROM users WHERE email = :email`,
            { email: decoded.email },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        await connection.close();
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        
        req.user = result.rows[0]; // Now you have req.user.ID
        next();
        
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};
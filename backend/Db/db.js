import OracleDB from "oracledb";
import dotenv from 'dotenv'
dotenv.config();
export async function getConnection() {
  try {
    const connection = await OracleDB.getConnection({
       user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING
    });
  
    return connection;
  } catch (error) {
    console.error("Error getting connection:", error);
    throw error;
  }
}

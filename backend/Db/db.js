import OracleDB from "oracledb";

export async function getConnection() {
  try {
    const connection = await OracleDB.getConnection({
       user: "system",
       password: "oracle",
    connectString: "localhost/XEPDB1"
    });
    return connection;
  } catch (error) {
    console.error("Error getting connection:", error);
    throw error;
  }
}

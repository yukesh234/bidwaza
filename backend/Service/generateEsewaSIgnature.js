import crypto from "crypto";

export const generateEsewaSignature = (amount, transaction_uuid) => {
  if (!amount || !transaction_uuid || !process.env.ESEWA_PRODUCT_CODE) {
    throw new Error("Missing required fields for eSewa signature");
  }

  const data = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE}`;
  
  try {
    const secretKey = process.env.ESEWA_SECRET_KEY;
    
    // ADD THESE LOGS
    console.log("=== eSewa Signature Debug ===");
    console.log("Amount:", amount);
    console.log("Transaction UUID:", transaction_uuid);
    console.log("Product Code:", process.env.ESEWA_PRODUCT_CODE);
    console.log("Secret Key:", secretKey);
    console.log("Data string:", data);
    
    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(data)
      .digest("base64");

    console.log("Generated signature:", hash);
    console.log("========================");

    return {
      signature: hash,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };
  } catch (error) {
    console.error("Signature generation failed:", error);
    throw error;
  }
};
import crypto from "crypto";

export const generateEsewaSignature = (amount, transaction_uuid) => {
  if (!amount || !transaction_uuid || !process.env.ESEWA_PRODUCT_CODE) {
    throw new Error("Missing required fields for eSewa signature");
  }

  const data = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE}`;

  try {
    const secretKey = process.env.ESEWA_SECRET_KEY;
    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(data)
      .digest("base64");

    return {
      signature: hash,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };
  } catch (error) {
    console.error("Signature generation failed:", error);
    throw error;
  }
};

import fs from "fs";
import uploadImage from "../Service/cloudinary.js";
import { getConnection } from "../db/db.js";

export async function uploadProfile(req, res) {
  try {
    const { userid } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File not found" });
    }

    const filePath = req.file.path;
    const response = await uploadImage(filePath);
    const imageUrl = response.secure_url;

    const connection = await getConnection();
    await connection.execute(
      `UPDATE users 
       SET profile_picture_url = :url 
       WHERE id = :id`,
      { url: imageUrl, id: userid },
      { autoCommit: true }
    );

    // delete local temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true, url: imageUrl });

  } catch (error) {
    console.error("Upload PFP error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Profile picture upload failed" });
  }
}

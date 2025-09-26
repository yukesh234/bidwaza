import fs from "fs";
import {uploadImage,deleteImage} from "../Service/cloudinary.js";
import { getConnection } from "../Db/Db.js";

export async function uploadProfile(req, res) {
  try {
    const userid  = req.user.ID;

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

export async function editprofile(req, res) {
  let connection;
  try {
    const userId = req.user.ID;

    if (!req.file) {
      return res.status(400).json({ message: "File not found" });
    }

    connection = await getConnection();

    // Get old profile picture (if exists)
    const olderpfpResult = await connection.execute(
      `SELECT profile_picture_url FROM users WHERE id = :id`,
      { id: userId }
    );
    const olderpfp =
      olderpfpResult.rows.length > 0 ? olderpfpResult.rows[0][0] : null;

    // Upload new picture
    const filepath = req.file.path;
    const newpfpUrl = await uploadImage(filepath); // returns secure_url

    // Update user profile with new picture
    await connection.execute(
      `UPDATE users 
       SET profile_picture_url = :url,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      { url: newpfpUrl, id: userId },
      { autoCommit: true }
    );

    // Delete old picture from Cloudinary (optional)
    if (olderpfp) {
      await deleteImage(olderpfp);
    }

    res.json({ success: true, url: newpfpUrl });
  } catch (error) {
    console.error("Upload PFP error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: "Profile picture upload failed" });
  } finally {
    if (connection) await connection.close();
  }
}
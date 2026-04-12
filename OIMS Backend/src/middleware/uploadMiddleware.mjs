import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define base upload directory (public/uploads)
const UPLOAD_BASE_DIR = path.join(__dirname, "../../public/uploads");

// Ensure base directories exist
const PROFILE_UPLOAD_DIR = path.join(UPLOAD_BASE_DIR, "profiles");
[UPLOAD_BASE_DIR, PROFILE_UPLOAD_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// === Multer Storage Configuration ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PROFILE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${fileExtension}`);
  },
});

// === File Filter ===
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  
  const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const isExtensionAllowed = allowedExtensions.includes(fileExtension);

  if (isMimeTypeAllowed && isExtensionAllowed) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG and WebP are allowed."), false);
  }
};

// === Export Profile Uploader ===
export const uploadProfilePicture = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
}).single("profilePicture");

// Utility to delete a file
export const deleteFile = (filename) => {
  if (!filename) return false;
  // If the stored filename includes /uploads/profiles/, strip it
  const cleanName = filename.split('/').pop();
  const filePath = path.join(PROFILE_UPLOAD_DIR, cleanName);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

// Centralized error handler for Multer
export const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let errorMessage = "Upload error.";
    if (err.code === "LIMIT_FILE_SIZE") errorMessage = "File too large. Maximum size is 5MB.";
    else if (err.code === "LIMIT_UNEXPECTED_FILE") errorMessage = "Unexpected field name for profile picture.";
    
    return res.status(400).json({ success: false, message: errorMessage });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};
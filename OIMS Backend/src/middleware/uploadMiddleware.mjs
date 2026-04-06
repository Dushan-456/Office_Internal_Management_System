import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define base upload directory (e.g., 'public/uploads')
const UPLOAD_BASE_DIR = path.join(__dirname, "../../public/uploads");

// Ensure the base directory exists
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

// === Multer Storage Configuration ===
const createDiskStorage = (folderName) => {
  const uploadDir = path.join(UPLOAD_BASE_DIR, folderName);

  // Ensure the specific folder for this upload type exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir); // Store files in the specific folder
    },
    filename: (req, file, cb) => {
      // Generate a unique filename: fieldname-timestamp-original_extension
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileExtension = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
    },
  });
};

// === Multer File Filter Factory ===
// This function creates a file filter based on allowed MIME types or extensions.
const createFileFilter = (allowedMimeTypes, allowedExtensions) => {
  return (req, file, cb) => {
    const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isExtensionAllowed = allowedExtensions.includes(fileExtension);

    if (isMimeTypeAllowed && isExtensionAllowed) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type not allowed. Only ${allowedExtensions.join(
            ", "
          )} are permitted.`
        ),
        false
      );
    }
  };
};

// --- Predefined Allowed File Types ---
const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
];
const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];

const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_DOC_EXTS = [".pdf", ".doc", ".docx"];

// Combine image and document types for service orders
const ALLOWED_SERVICE_ORDER_MIMES = [
  ...ALLOWED_IMAGE_MIMES,
  ...ALLOWED_DOC_MIMES,
];
const ALLOWED_SERVICE_ORDER_EXTS = [...ALLOWED_IMAGE_EXTS, ...ALLOWED_DOC_EXTS];

// === Upload Service Factory ===
// This function creates a pre-configured Multer middleware for specific upload types.
const createUploader = (
  folderName,
  fieldName,
  allowedMimes,
  allowedExts,
  maxCount = 1
) => {
  const storage = createDiskStorage(folderName);
  const fileFilter = createFileFilter(allowedMimes, allowedExts);

  return multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit for all files
    fileFilter: fileFilter,
  }).array(fieldName, maxCount); // For multiple files with the same field name
};

// === Export specific upload middlewares ===
// Service Order: Images, PDF, DOC
export const uploadServiceOrderFiles = createUploader(
  "service-orders",
  "serviceFiles",
  ALLOWED_SERVICE_ORDER_MIMES,
  ALLOWED_SERVICE_ORDER_EXTS,
  5 // Max 5 files
);

// Category Image: Images only
export const uploadCategoryImages = createUploader(
  "categories",
  "categoryImage",
  ALLOWED_IMAGE_MIMES,
  ALLOWED_IMAGE_EXTS
);

// Product Images: Images only
export const uploadProductImages = createUploader(
  "products",
  "productImages",
  ALLOWED_IMAGE_MIMES,
  ALLOWED_IMAGE_EXTS,
  10 // Max 10 images
);

// Profile Picture: Images only
export const uploadProfilePicture = createUploader(
  "profiles",
  "profilePicture",
  ALLOWED_IMAGE_MIMES,
  ALLOWED_IMAGE_EXTS
);

// Utility to get file URL
export const getFileUrl = (folderName, filename) => {
  return `/uploads/${folderName}/${filename}`;
};

// Utility to delete a file
export const deleteFile = (folderName, filename) => {
  const filePath = path.join(UPLOAD_BASE_DIR, folderName, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

// Centralized error handler for Multer
export const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let errorMessage = "";
    if (err.code === "LIMIT_FILE_SIZE") {
      errorMessage = "File too large. Maximum size is 10MB.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      errorMessage = "Too many files uploaded.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      errorMessage = "Unexpected field name for file upload.";
    } else {
      errorMessage = err.message;
    }

    // Store error in request object for controller to handle
    req.uploadError = errorMessage;
    return res.status(400).json({
      message: errorMessage,
      code: err.code,
    });
  } else if (err) {
    // Custom error from fileFilter
    req.uploadError = err.message;
    return res.status(400).json({ message: err.message });
  }
  next();
};

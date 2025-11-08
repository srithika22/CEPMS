const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Generate unique filename
const generateFileName = (req, file) => {
  const randomName = crypto.randomBytes(16).toString('hex');
  const ext = path.extname(file.originalname);
  return `${Date.now()}-${randomName}${ext}`;
};

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  // Allow PDFs
  if (file.mimetype === 'application/pdf') {
    return cb(null, true);
  }
  // Allow documents
  if (file.mimetype.includes('document') || 
      file.mimetype.includes('msword') ||
      file.mimetype.includes('presentation') ||
      file.mimetype.includes('spreadsheet')) {
    return cb(null, true);
  }
  
  cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
};

// Configure multer for local storage (can be switched to S3 later)
const uploadToLocal = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, generateFileName(req, file));
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Configure multer for S3 upload (requires multer-s3 package)
// Install: npm install multer-s3
const uploadToS3 = (folder = 'uploads') => {
  try {
    const multerS3 = require('multer-s3');
    return multer({
      storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        acl: 'public-read',
        key: function (req, file, cb) {
          const fileName = generateFileName(req, file);
          cb(null, `${folder}/${fileName}`);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
      }),
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      }
    });
  } catch (error) {
    console.warn('multer-s3 not installed, falling back to local storage');
    return uploadToLocal;
  }
};

// Generate presigned URL for file upload (client-side)
const generatePresignedUrl = (fileName, folder = 'uploads', contentType = 'image/jpeg') => {
  const key = `${folder}/${Date.now()}-${fileName}`;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: 3600, // 1 hour
    ContentType: contentType,
    ACL: 'public-read'
  };

  return s3.getSignedUrl('putObject', params);
};

// Delete file from S3
const deleteFile = async (fileUrl) => {
  try {
    // Extract key from URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading '/'

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    };

    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

// Get file URL from key
const getFileUrl = (key) => {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};

module.exports = {
  uploadToS3,
  uploadToLocal,
  generatePresignedUrl,
  deleteFile,
  getFileUrl,
  s3
};


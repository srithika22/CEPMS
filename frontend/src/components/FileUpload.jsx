import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

const FileUpload = ({ 
  type = 'image',
  multiple = false,
  accept,
  onUploadSuccess,
  onUploadError,
  className = '',
  buttonText = 'Upload File',
  uploadUrl,
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Default accept types based on upload type
  const defaultAcceptTypes = {
    image: 'image/*',
    document: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt',
    video: 'video/*',
    any: '*/*'
  };

  const acceptTypes = accept || defaultAcceptTypes[type] || defaultAcceptTypes.any;

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
      return false;
    }

    // Check file type for images
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return false;
    }

    // Check file type for documents
    if (type === 'document') {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid document file (PDF, DOC, PPT, XLS, TXT)');
        return false;
      }
    }

    return true;
  };

  const uploadFiles = async (files) => {
    if (!uploadUrl) {
      toast.error('Upload URL not provided');
      return;
    }

    const validFiles = Array.from(files).filter(validateFile);
    
    if (validFiles.length === 0) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      
      if (multiple) {
        validFiles.forEach(file => {
          formData.append('files', file);
        });
      } else {
        formData.append('files', validFiles[0]); // Use 'files' for consistency
      }

      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000${uploadUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      toast.success(data.message || 'File uploaded successfully');
      
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
      
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${uploading ? 'pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {type === 'image' && 'PNG, JPG, GIF up to '}
                {type === 'document' && 'PDF, DOC, PPT, XLS up to '}
                {type === 'any' && 'Any file up to '}
                {formatFileSize(maxSize)}
              </p>
              {multiple && (
                <p className="text-xs text-gray-500">
                  Multiple files allowed
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized components for common use cases
export const ImageUpload = (props) => (
  <FileUpload
    type="image"
    {...props}
  />
);

export const DocumentUpload = (props) => (
  <FileUpload
    type="document"
    multiple={true}
    {...props}
  />
);

export const ProfilePictureUpload = (props) => (
  <FileUpload
    type="image"
    maxSize={2 * 1024 * 1024} // 2MB for profile pictures
    uploadUrl="/api/uploads/profile-picture"
    {...props}
  />
);

export default FileUpload;

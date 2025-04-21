import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

const FileUpload = ({ 
  onFileChange, 
  accept = "image/*", 
  maxSizeMB = 1, 
  className = "",
  label = "Upload File"
}) => {
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError(null);
    
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      return;
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
      return;
    }
    
    // Set the selected file
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    
    // Notify parent component
    if (onFileChange) {
      onFileChange(file);
    }
  };
  
  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Notify parent component
    if (onFileChange) {
      onFileChange(null);
    }
  };
  
  return (
    <div className={`${className}`}>
      {!selectedFile ? (
        <>
          <label className="block">
            <span className="sr-only">{label}</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileChange}
            />
            <div className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer inline-flex items-center">
              <Upload size={16} className="mr-2" />
              {label}
            </div>
          </label>
          {error && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </>
      ) : (
        <div className="mt-2">
          {preview && (
            <div className="relative w-20 h-20 rounded-full overflow-hidden mb-2">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center">
            <span className="text-sm text-slate-700 truncate">
              {selectedFile.name}
            </span>
            <button
              type="button"
              onClick={clearFile}
              className="ml-2 p-1 rounded hover:bg-slate-100 text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
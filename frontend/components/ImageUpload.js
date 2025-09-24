"use client";

import { useState } from "react";
import axios from "axios";

export default function ImageUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    setSelectedFile(file);

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      if (file) {
        alert("Please select an image file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:8000/upload-image",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Reset state
      setSelectedFile(null);
      setPreview(null);

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        "Upload failed: " + (error.response?.data?.detail || error.message)
      );
    } finally {
      setUploading(false);
    }
  };

  // ...existing code...

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">
          Upload Image
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Upload your images for AI-powered processing
        </p>
      </div>

      {!selectedFile ? (
        <div
          className={`relative p-8 border-2 border-dashed rounded-lg text-center transition-all cursor-pointer ${
            isDragOver
              ? "border-green-500 bg-green-50"
              : "border-gray-300 bg-white"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            <svg
              className={`w-10 h-10 ${
                isDragOver ? "text-gray-500" : "text-gray-400"
              } transition-colors`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p
              className={`text-base font-semibold ${
                isDragOver ? "text-gray-500" : "text-gray-900"
              } m-0`}
            >
              {isDragOver ? "Drop your image here" : "Drag & drop an image"}
            </p>
            <p className="text-sm text-gray-500 m-0">
              or click to browse • PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-5 items-start">
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-44 h-44 rounded-lg object-cover border border-gray-200 shadow"
            />
          )}
          <div className="flex-1 p-5 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-lg font-semibold text-gray-900 mb-1 break-words">
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {Math.round(selectedFile.size / 1024)} KB • {selectedFile.type}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`px-5 py-2 rounded font-semibold text-sm transition-colors tracking-wide ${
                  uploading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {uploading ? (
                  <>
                    <svg
                      className="inline-block w-4 h-4 mr-2 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Upload Image"
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  const fileInput =
                    document.querySelector('input[type="file"]');
                  if (fileInput) fileInput.value = "";
                }}
                className="px-5 py-2 border border-gray-300 rounded font-semibold text-sm text-gray-500 bg-white hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

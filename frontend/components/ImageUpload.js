"use client";

import { useState } from "react";
import axios from "axios";

export default function ImageUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
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

      alert("Image uploaded successfully!");
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

  return (
    <div
      style={{
        padding: 20,
        border: "2px dashed #007bff",
        borderRadius: 8,
        textAlign: "center",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h3>Upload Image</h3>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ margin: "10px 0" }}
      />

      {preview && (
        <div style={{ margin: "15px 0" }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: "200px",
              maxHeight: "200px",
              borderRadius: 4,
              border: "1px solid #ddd",
            }}
          />
          <p style={{ fontSize: "0.9em", color: "#666" }}>
            {selectedFile?.name} ({Math.round(selectedFile?.size / 1024)} KB)
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        style={{
          padding: "10px 20px",
          backgroundColor: selectedFile && !uploading ? "#007bff" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: selectedFile && !uploading ? "pointer" : "not-allowed",
        }}
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
}

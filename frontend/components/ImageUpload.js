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

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
    },
    title: {
      fontSize: "20px",
      fontWeight: 600,
      color: "#2d4a2b",
      margin: 0,
      marginBottom: 6,
      letterSpacing: "-0.2px",
    },
    subtitle: {
      fontSize: "14px",
      color: "#6b7280",
      margin: 0,
      marginBottom: 20,
    },
    dropZone: {
      padding: 32,
      border: `2px dashed ${isDragOver ? "#22c55e" : "#d1d5db"}`,
      borderRadius: 8,
      textAlign: "center",
      backgroundColor: isDragOver ? "#f0fff4" : "#ffffff",
      transition: "all 0.2s ease",
      cursor: "pointer",
      position: "relative",
    },
    dropZoneContent: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    },
    uploadIcon: {
      width: 40,
      height: 40,
      color: isDragOver ? "#22c55e" : "#9ca3af",
      transition: "color 0.2s ease",
    },
    dropText: {
      fontSize: "16px",
      fontWeight: 600,
      color: isDragOver ? "#22c55e" : "#2d4a2b",
      margin: 0,
    },
    dropSubtext: {
      fontSize: "14px",
      color: "#6b7280",
      margin: 0,
    },
    fileInput: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      opacity: 0,
      cursor: "pointer",
    },
    previewContainer: {
      display: "flex",
      gap: 20,
      alignItems: "flex-start",
    },
    previewImage: {
      width: 180,
      height: 180,
      borderRadius: 8,
      objectFit: "cover",
      border: "1px solid #e5e5e5",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    fileInfo: {
      flex: 1,
      padding: 20,
      backgroundColor: "#f8f9fa",
      borderRadius: 8,
      border: "1px solid #e5e5e5",
    },
    fileName: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#2d4a2b",
      margin: 0,
      marginBottom: 6,
      wordBreak: "break-word",
    },
    fileSize: {
      fontSize: "14px",
      color: "#6b7280",
      margin: 0,
      marginBottom: 16,
    },
    actionButtons: {
      display: "flex",
      gap: 10,
    },
    uploadButton: {
      padding: "10px 20px",
      backgroundColor: uploading ? "#f3f4f6" : "#22c55e",
      color: uploading ? "#9ca3af" : "#ffffff",
      border: "none",
      borderRadius: 6,
      fontSize: "14px",
      fontWeight: 600,
      cursor: uploading ? "not-allowed" : "pointer",
      transition: "background-color 0.2s ease",
      letterSpacing: "0.2px",
    },
    uploadButtonHover: {
      backgroundColor: "#16a34a",
    },
    cancelButton: {
      padding: "10px 20px",
      backgroundColor: "transparent",
      color: "#6b7280",
      border: "1px solid #d1d5db",
      borderRadius: 6,
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s ease",
      letterSpacing: "0.2px",
    },
    cancelButtonHover: {
      backgroundColor: "#f9fafb",
      borderColor: "#9ca3af",
      color: "#374151",
    },
    successMessage: {
      padding: "12px 16px",
      backgroundColor: "#f0fff4",
      border: "1px solid #bbf7d0",
      borderRadius: 6,
      color: "#22c55e",
      fontSize: "14px",
      fontWeight: 500,
      textAlign: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
  };

  return (
    <div style={styles.container}>
      <div>
        <h3 style={styles.title}>Upload Image</h3>
        <p style={styles.subtitle}>
          Upload your images for AI-powered processing
        </p>
      </div>

      {!selectedFile ? (
        <div
          style={styles.dropZone}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={styles.fileInput}
          />
          <div style={styles.dropZoneContent}>
            <svg
              style={styles.uploadIcon}
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
            <p style={styles.dropText}>
              {isDragOver ? "Drop your image here" : "Drag & drop an image"}
            </p>
            <p style={styles.dropSubtext}>
              or click to browse • PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>
      ) : (
        <div style={styles.previewContainer}>
          {preview && (
            <img src={preview} alt="Preview" style={styles.previewImage} />
          )}
          <div style={styles.fileInfo}>
            <p style={styles.fileName}>{selectedFile.name}</p>
            <p style={styles.fileSize}>
              {Math.round(selectedFile.size / 1024)} KB • {selectedFile.type}
            </p>
            <div style={styles.actionButtons}>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={styles.uploadButton}
                onMouseEnter={(e) =>
                  !uploading &&
                  Object.assign(e.target.style, styles.uploadButtonHover)
                }
                onMouseLeave={(e) =>
                  Object.assign(e.target.style, styles.uploadButton)
                }
              >
                {uploading ? (
                  <>
                    <svg
                      style={{
                        width: 16,
                        height: 16,
                        marginRight: 8,
                        animation: "spin 1s linear infinite",
                      }}
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
                style={styles.cancelButton}
                onMouseEnter={(e) =>
                  Object.assign(e.target.style, styles.cancelButtonHover)
                }
                onMouseLeave={(e) =>
                  Object.assign(e.target.style, styles.cancelButton)
                }
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

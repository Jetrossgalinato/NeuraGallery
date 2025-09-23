"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function ImageGallery({ refreshTrigger }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/my-images", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setImages(response.data);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger]);

  if (loading) {
    return <div>Loading images...</div>;
  }

  if (images.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 20, color: "#666" }}>
        <p>No images uploaded yet. Upload your first image above!</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Your Images ({images.length})</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 15,
          marginTop: 15,
        }}
      >
        {images.map((image) => (
          <div
            key={image.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 10,
              backgroundColor: "white",
            }}
          >
            <div
              style={{
                width: "100%",
                height: 150,
                backgroundColor: "#f5f5f5",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <img
                src={`http://localhost:8000/uploads/${image.filename}`}
                alt={image.original_filename}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "cover",
                  borderRadius: 4,
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <div style={{ display: "none", color: "#999" }}>
                Image not available
              </div>
            </div>
            <p
              style={{
                fontSize: "0.9em",
                fontWeight: "bold",
                margin: "5px 0",
                wordBreak: "break-word",
              }}
            >
              {image.original_filename}
            </p>
            <p style={{ fontSize: "0.8em", color: "#666", margin: "2px 0" }}>
              Size: {Math.round(image.file_size / 1024)} KB
            </p>
            <p style={{ fontSize: "0.8em", color: "#666", margin: "2px 0" }}>
              Uploaded: {new Date(image.uploaded_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

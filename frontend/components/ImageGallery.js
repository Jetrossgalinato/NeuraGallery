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

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    title: {
      fontSize: "20px",
      fontWeight: 600,
      color: "#2d4a2b",
      margin: 0,
      letterSpacing: "-0.2px",
    },
    count: {
      fontSize: "14px",
      color: "#6b7280",
      backgroundColor: "#f3f4f6",
      padding: "4px 10px",
      borderRadius: 6,
      fontWeight: 500,
    },
    subtitle: {
      fontSize: "14px",
      color: "#6b7280",
      margin: 0,
      marginBottom: 20,
    },
    loadingContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      color: "#6b7280",
      fontSize: "14px",
    },
    loadingSpinner: {
      width: 20,
      height: 20,
      border: "2px solid #e5e5e5",
      borderTop: "2px solid #22c55e",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginRight: 10,
    },
    emptyState: {
      textAlign: "center",
      padding: 48,
      backgroundColor: "#ffffff",
      borderRadius: 8,
      border: "2px dashed #d1d5db",
    },
    emptyIcon: {
      width: 48,
      height: 48,
      color: "#d1d5db",
      margin: "0 auto 16px",
    },
    emptyTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#2d4a2b",
      margin: 0,
      marginBottom: 6,
    },
    emptyText: {
      fontSize: "14px",
      color: "#6b7280",
      margin: 0,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: 20,
    },
    imageCard: {
      backgroundColor: "#ffffff",
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      border: "1px solid #e5e5e5",
      transition: "all 0.2s ease",
    },
    imageCardHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
    },
    imageContainer: {
      width: "100%",
      height: 180,
      backgroundColor: "#f9fafb",
      position: "relative",
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "transform 0.2s ease",
    },
    imageHover: {
      transform: "scale(1.03)",
    },
    imagePlaceholder: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      color: "#9ca3af",
      fontSize: "12px",
      fontWeight: 500,
    },
    cardContent: {
      padding: 16,
    },
    imageName: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#2d4a2b",
      margin: 0,
      marginBottom: 10,
      wordBreak: "break-word",
      lineHeight: 1.3,
    },
    imageInfo: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
    },
    infoItem: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: "12px",
      color: "#6b7280",
    },
    infoIcon: {
      width: 14,
      height: 14,
      color: "#9ca3af",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Your Gallery</h3>
        </div>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          Loading your images...
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Your Gallery</h3>
          <span style={styles.count}>0 images</span>
        </div>
        <div style={styles.emptyState}>
          <svg
            style={styles.emptyIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h4 style={styles.emptyTitle}>No images yet</h4>
          <p style={styles.emptyText}>
            Upload your first image to get started with your gallery
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Your Gallery</h3>
        <span style={styles.count}>
          {images.length} {images.length === 1 ? "image" : "images"}
        </span>
      </div>
      <p style={styles.subtitle}>
        Your uploaded images with AI processing capabilities
      </p>{" "}
      <div style={styles.grid}>
        {images.map((image) => (
          <div
            key={image.id}
            style={styles.imageCard}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, styles.imageCardHover)
            }
            onMouseLeave={(e) =>
              Object.assign(e.currentTarget.style, styles.imageCard)
            }
          >
            <div style={styles.imageContainer}>
              <img
                src={`http://localhost:8000/uploads/${image.filename}`}
                alt={image.original_filename}
                style={styles.image}
                onMouseEnter={(e) =>
                  Object.assign(e.target.style, styles.imageHover)
                }
                onMouseLeave={(e) =>
                  Object.assign(e.target.style, styles.image)
                }
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div style={{ ...styles.imagePlaceholder, display: "none" }}>
                <svg
                  style={{ width: 32, height: 32, marginRight: 8 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Image not available
              </div>
            </div>
            <div style={styles.cardContent}>
              <h4 style={styles.imageName}>{image.original_filename}</h4>
              <div style={styles.imageInfo}>
                <div style={styles.infoItem}>
                  <svg
                    style={styles.infoIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {Math.round(image.file_size / 1024)} KB
                </div>
                <div style={styles.infoItem}>
                  <svg
                    style={styles.infoIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a4 4 0 118 0v4m-4 12v-1m0-6V9m4 4v3a4 4 0 11-8 0v-3"
                    />
                  </svg>
                  {image.mime_type}
                </div>
                <div style={styles.infoItem}>
                  <svg
                    style={styles.infoIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {new Date(image.uploaded_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

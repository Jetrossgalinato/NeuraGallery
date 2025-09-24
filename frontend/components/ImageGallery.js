"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function ImageGallery({ refreshTrigger }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  // controls for preview modal - keep at top level to obey rules of hooks
  const [zoom, setZoom] = useState(1);

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

  // ...existing code...

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-2xl font-semibold text-gray-900">Your Gallery</h3>
        </div>
        <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
          <span className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-2"></span>
          Loading your images...
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-2xl font-semibold text-gray-900">Your Gallery</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded font-medium">
            0 images
          </span>
        </div>
        <div className="text-center p-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto mb-4 w-12 h-12 text-gray-300"
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
          <h4 className="text-lg font-semibold text-gray-900 mb-1">
            No images yet
          </h4>
          <p className="text-sm text-gray-500">
            Upload your first image to get started with your gallery
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-2xl font-semibold text-gray-900">Your Gallery</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded font-medium">
          {images.length} {images.length === 1 ? "image" : "images"}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Your uploaded images with AI processing capabilities
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {images.map((image) => (
          <div
            key={image.id}
            className="bg-white rounded-lg overflow-hidden shadow border border-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
            onClick={() => setPreviewImage(image)}
          >
            <div className="w-full h-44 bg-gray-50 relative overflow-hidden">
              <img
                src={`http://localhost:8000/uploads/${image.filename}`}
                alt={image.original_filename}
                className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="hidden absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-medium">
                <svg
                  className="w-8 h-8 mr-2"
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
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 break-words leading-tight">
                {image.original_filename}
              </h4>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
      {/* Modal for image preview (fullscreen) */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
          onClick={() => {
            setPreviewImage(null);
            setZoom(1);
          }}
        >
          <div
            className="absolute inset-0"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="relative z-50 w-full h-full flex flex-col">
            {/* top controls */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-60">
              <button
                className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 font-semibold text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom((z) => Math.max(0.25, z - 0.25));
                }}
              >
                -
              </button>
              <button
                className="px-3 py-2 bg-gray-900 text-white rounded font-semibold text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 font-semibold text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom((z) => Math.min(4, z + 0.25));
                }}
              >
                +
              </button>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-semibold text-sm ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  // placeholder for edit flow
                }}
              >
                Edit
              </button>
            </div>

            {/* center image area */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={`http://localhost:8000/uploads/${previewImage.filename}`}
                alt={previewImage.original_filename}
                style={{
                  transform: `scale(${zoom})`,
                  maxWidth: "90vw",
                  maxHeight: "90vh",
                  transition: "transform 0.15s ease",
                }}
                className="rounded-md"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* bottom info and close */}
            <div className="p-6 flex items-center justify-between text-white">
              <div>
                <div className="font-semibold text-lg">
                  {previewImage.original_filename}
                </div>
                <div className="text-sm text-gray-300">
                  {Math.round(previewImage.file_size / 1024)} KB •{" "}
                  {previewImage.mime_type}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 font-semibold"
                  onClick={() => {
                    setPreviewImage(null);
                    setZoom(1);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

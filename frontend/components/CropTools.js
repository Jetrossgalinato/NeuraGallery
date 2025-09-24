"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function CropTools({ image, dimensions, onProcessed, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [cropParams, setCropParams] = useState({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });

  const applyCrop = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        x: cropParams.x.toString(),
        y: cropParams.y.toString(),
        width: cropParams.width.toString(),
        height: cropParams.height.toString(),
      });

      const response = await axios.post(
        `http://localhost:8000/image/${image.id}/crop?${params.toString()}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Crop applied! File: ${response.data.processed_filename}`);
      if (onProcessed) onProcessed();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error applying crop:", error);
      alert(
        `Failed to apply crop: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setProcessing(false);
    }
  };

  const updateCropParam = (field, value) => {
    setCropParams((prev) => ({
      ...prev,
      [field]: parseInt(value) || 0,
    }));
  };

  const setCenterCrop = () => {
    if (dimensions) {
      setCropParams({
        x: Math.floor(dimensions.width * 0.25),
        y: Math.floor(dimensions.height * 0.25),
        width: Math.floor(dimensions.width * 0.5),
        height: Math.floor(dimensions.height * 0.5),
      });
    }
  };

  // Initialize with smart defaults when dimensions are available
  useEffect(() => {
    if (dimensions && cropParams.width === 200 && cropParams.height === 200) {
      setCenterCrop();
    }
  }, [dimensions]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-300 flex items-center">
        <span className="text-lg mr-2">✂️</span>
        Crop
      </h4>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              X Position
            </label>
            <input
              type="number"
              min="0"
              value={cropParams.x}
              onChange={(e) => updateCropParam("x", e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Y Position
            </label>
            <input
              type="number"
              min="0"
              value={cropParams.y}
              onChange={(e) => updateCropParam("y", e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Width</label>
            <input
              type="number"
              min="1"
              value={cropParams.width}
              onChange={(e) => updateCropParam("width", e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Height</label>
            <input
              type="number"
              min="1"
              value={cropParams.height}
              onChange={(e) => updateCropParam("height", e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        {dimensions && (
          <div className="space-y-2">
            <button
              onClick={setCenterCrop}
              className="w-full py-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-400 rounded hover:border-blue-300 transition-colors"
            >
              🎯 Set Center Crop (50%)
            </button>
            <div className="text-xs text-gray-500 bg-gray-800 rounded p-2">
              <div>
                Image: {dimensions.width} × {dimensions.height} px
              </div>
              <div>
                Crop: {cropParams.width} × {cropParams.height} px
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={applyCrop}
        disabled={processing}
        className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:bg-gray-600 font-medium text-sm"
      >
        {processing ? "Cropping..." : "Apply Crop"}
      </button>
    </div>
  );
}

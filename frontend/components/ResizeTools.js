"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function ResizeTools({
  image,
  dimensions,
  onProcessed,
  onClose,
}) {
  const [processing, setProcessing] = useState(false);
  const [resizeParams, setResizeParams] = useState({
    width: dimensions?.width || 400,
    height: dimensions?.height || 300,
    interpolation: "linear",
  });

  const applyResize = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        width: resizeParams.width.toString(),
        height: resizeParams.height.toString(),
        interpolation: resizeParams.interpolation,
      });

      const response = await axios.post(
        `http://localhost:8000/image/${image.id}/resize?${params.toString()}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Resize applied! File: ${response.data.processed_filename}`);
      if (onProcessed) onProcessed();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error applying resize:", error);
      alert(
        `Failed to apply resize: ${
          error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setProcessing(false);
    }
  };

  const updateResizeParam = (field, value) => {
    setResizeParams((prev) => ({
      ...prev,
      [field]: field === "interpolation" ? value : parseInt(value) || 1,
    }));
  };

  // Update dimensions when prop changes
  useEffect(() => {
    if (dimensions) {
      setResizeParams((prev) => ({
        ...prev,
        width: dimensions.width,
        height: dimensions.height,
      }));
    }
  }, [dimensions]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-300 flex items-center">
        <span className="text-lg mr-2">📐</span>
        Resize
      </h4>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Width</label>
            <input
              type="number"
              value={resizeParams.width}
              onChange={(e) => updateResizeParam("width", e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
              min="1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Height</label>
            <input
              type="number"
              value={resizeParams.height}
              onChange={(e) => updateResizeParam("height", e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Interpolation
          </label>
          <select
            value={resizeParams.interpolation}
            onChange={(e) => updateResizeParam("interpolation", e.target.value)}
            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="nearest">Nearest</option>
            <option value="linear">Linear</option>
            <option value="cubic">Cubic</option>
            <option value="lanczos">Lanczos</option>
          </select>
        </div>

        {dimensions && (
          <div className="text-xs text-gray-500 bg-gray-800 rounded p-2">
            Original: {dimensions.width} × {dimensions.height} px
          </div>
        )}
      </div>

      <button
        onClick={applyResize}
        disabled={processing}
        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:bg-gray-600 font-medium text-sm"
      >
        {processing ? "Resizing..." : "Apply Resize"}
      </button>
    </div>
  );
}

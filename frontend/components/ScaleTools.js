"use client";

import { useState } from "react";
import axios from "axios";

export default function ScaleTools({ image, onProcessed, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [scaleParams, setScaleParams] = useState({
    scaleX: 1.0,
    scaleY: 1.0,
  });

  const applyScale = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        scale_x: scaleParams.scaleX.toString(),
        scale_y: scaleParams.scaleY.toString(),
        interpolation: "linear", // Default interpolation
      });

      const response = await axios.post(
        `http://localhost:8000/image/${image.id}/scale?${params.toString()}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Scale applied! File: ${response.data.processed_filename}`);
      if (onProcessed) onProcessed();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error applying scale:", error);
      alert(
        `Failed to apply scale: ${
          error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setProcessing(false);
    }
  };

  const updateScaleParam = (field, value) => {
    setScaleParams((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 1.0,
    }));
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-300 flex items-center">
        <span className="text-lg mr-2">🔍</span>
        Scale
      </h4>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Scale X</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5.0"
              value={scaleParams.scaleX}
              onChange={(e) => updateScaleParam("scaleX", e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Scale Y</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5.0"
              value={scaleParams.scaleY}
              onChange={(e) => updateScaleParam("scaleY", e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-800 rounded p-2">
          <div>Scale X: {(scaleParams.scaleX * 100).toFixed(0)}%</div>
          <div>Scale Y: {(scaleParams.scaleY * 100).toFixed(0)}%</div>
        </div>
      </div>

      <button
        onClick={applyScale}
        disabled={processing}
        className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:bg-gray-600 font-medium text-sm"
      >
        {processing ? "Scaling..." : "Apply Scale"}
      </button>
    </div>
  );
}

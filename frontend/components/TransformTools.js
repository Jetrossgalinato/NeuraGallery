"use client";

import { useState } from "react";
import axios from "axios";

export default function TransformTools({ image, onProcessed, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [transformParams, setTransformParams] = useState({
    translateX: 0,
    translateY: 0,
    rotation: 0,
  });

  const applyTransform = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      // Build query parameters for both translate and rotate
      let params = new URLSearchParams({
        operation: "translate", // We'll do translate first
        tx: transformParams.translateX.toString(),
        ty: transformParams.translateY.toString(),
      });

      // If there's rotation, we'll need to do it separately
      const hasRotation = transformParams.rotation !== 0;
      const hasTranslation =
        transformParams.translateX !== 0 || transformParams.translateY !== 0;

      if (hasTranslation) {
        const response = await axios.post(
          `http://localhost:8000/image/${
            image.id
          }/transform?${params.toString()}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!hasRotation) {
          alert(`Transform applied! File: ${response.data.processed_filename}`);
          if (onProcessed) onProcessed();
          if (onClose) onClose();
          return;
        }
      }

      if (hasRotation) {
        // Apply rotation (possibly after translation)
        let rotationParams = new URLSearchParams({
          operation: "rotate",
          angle: transformParams.rotation.toString(),
        });

        const response = await axios.post(
          `http://localhost:8000/image/${
            image.id
          }/transform?${rotationParams.toString()}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        alert(`Transform applied! File: ${response.data.processed_filename}`);
        if (onProcessed) onProcessed();
        if (onClose) onClose();
      } else if (!hasTranslation) {
        alert(
          "No transformation to apply. Please set translation or rotation values."
        );
      }
    } catch (error) {
      console.error("Error applying transform:", error);
      alert(
        `Failed to apply transform: ${
          error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setProcessing(false);
    }
  };

  const updateTransformParam = (field, value) => {
    setTransformParams((prev) => ({
      ...prev,
      [field]: parseInt(value) || 0,
    }));
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-300 flex items-center">
        <span className="text-lg mr-2">🔄</span>
        Transform
      </h4>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Translate X
            </label>
            <input
              type="number"
              value={transformParams.translateX}
              onChange={(e) =>
                updateTransformParam("translateX", e.target.value)
              }
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Translate Y
            </label>
            <input
              type="number"
              value={transformParams.translateY}
              onChange={(e) =>
                updateTransformParam("translateY", e.target.value)
              }
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Rotation</label>
            <span className="text-xs text-gray-400">
              {transformParams.rotation}°
            </span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={transformParams.rotation}
            onChange={(e) => updateTransformParam("rotation", e.target.value)}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      <button
        onClick={applyTransform}
        disabled={processing}
        className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:bg-gray-600 font-medium text-sm"
      >
        {processing ? "Transforming..." : "Apply Transform"}
      </button>
    </div>
  );
}

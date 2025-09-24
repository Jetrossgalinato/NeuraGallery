"use client";

import { useState } from "react";
import axios from "axios";

export default function DrawingTools({ image, onProcessed, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [drawingTool, setDrawingTool] = useState("line");
  const [drawingColor, setDrawingColor] = useState("#FF0000");
  const [drawingThickness, setDrawingThickness] = useState(2);
  const [drawingText, setDrawingText] = useState("Sample Text");
  const [drawingCoords, setDrawingCoords] = useState({
    x1: 50,
    y1: 50,
    x2: 150,
    y2: 150,
  });

  const applyDrawing = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      // Convert hex color to RGB
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : null;
      };

      const color = hexToRgb(drawingColor);

      // Build query parameters based on shape type
      let params = new URLSearchParams({
        shape_type: drawingTool,
        start_x: drawingCoords.x1.toString(),
        start_y: drawingCoords.y1.toString(),
        color_r: color.r.toString(),
        color_g: color.g.toString(),
        color_b: color.b.toString(),
        thickness: drawingThickness.toString(),
      });

      // Add shape-specific parameters
      if (drawingTool === "text") {
        params.append("text", drawingText);
        params.append("font_size", "1.0");
      } else if (drawingTool === "circle") {
        // For circle, calculate radius from coordinates
        const radius = Math.round(
          Math.sqrt(
            Math.pow(drawingCoords.x2 - drawingCoords.x1, 2) +
              Math.pow(drawingCoords.y2 - drawingCoords.y1, 2)
          )
        );
        params.append("radius", radius.toString());
      } else {
        // For line and rectangle
        params.append("end_x", drawingCoords.x2.toString());
        params.append("end_y", drawingCoords.y2.toString());
      }

      const response = await axios.post(
        `http://localhost:8000/image/${image.id}/draw?${params.toString()}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Drawing applied! File: ${response.data.processed_filename}`);
      if (onProcessed) onProcessed();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error applying drawing:", error);
      alert(
        `Failed to apply drawing: ${
          error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setProcessing(false);
    }
  };

  const updateCoordinates = (field, value) => {
    setDrawingCoords((prev) => ({
      ...prev,
      [field]: parseInt(value) || 0,
    }));
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-300 flex items-center">
        <span className="text-lg mr-2">✏️</span>
        Drawing Tools
      </h4>

      {/* Drawing Tool Selection */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: "line", label: "Line", icon: "📏" },
          { value: "rectangle", label: "Rectangle", icon: "▭" },
          { value: "circle", label: "Circle", icon: "⭕" },
          { value: "text", label: "Text", icon: "📝" },
        ].map((tool) => (
          <button
            key={tool.value}
            onClick={() => setDrawingTool(tool.value)}
            className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${
              drawingTool === tool.value
                ? "border-blue-400 bg-gray-700 text-blue-400"
                : "border-gray-600 hover:border-gray-400 text-gray-300"
            }`}
          >
            <span className="mr-2">{tool.icon}</span>
            <span className="text-sm">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Drawing Parameters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-300">Color</label>
          <input
            type="color"
            value={drawingColor}
            onChange={(e) => setDrawingColor(e.target.value)}
            className="w-10 h-8 rounded border border-gray-600 bg-transparent"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Thickness</label>
            <span className="text-xs text-gray-400">{drawingThickness}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={drawingThickness}
            onChange={(e) => setDrawingThickness(parseInt(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {drawingTool === "text" && (
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Text</label>
            <input
              type="text"
              value={drawingText}
              onChange={(e) => setDrawingText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
              placeholder="Enter text to draw"
            />
          </div>
        )}

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              {drawingTool === "circle" ? "Center X" : "X1"}
            </label>
            <input
              type="number"
              value={drawingCoords.x1}
              onChange={(e) => updateCoordinates("x1", e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              {drawingTool === "circle" ? "Center Y" : "Y1"}
            </label>
            <input
              type="number"
              value={drawingCoords.y1}
              onChange={(e) => updateCoordinates("y1", e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          {drawingTool !== "text" && (
            <>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  {drawingTool === "circle" ? "Edge X" : "X2"}
                </label>
                <input
                  type="number"
                  value={drawingCoords.x2}
                  onChange={(e) => updateCoordinates("x2", e.target.value)}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  {drawingTool === "circle" ? "Edge Y" : "Y2"}
                </label>
                <input
                  type="number"
                  value={drawingCoords.y2}
                  onChange={(e) => updateCoordinates("y2", e.target.value)}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        {drawingTool === "circle" && (
          <div className="text-xs text-gray-500 bg-gray-800 rounded p-2">
            Radius:{" "}
            {Math.round(
              Math.sqrt(
                Math.pow(drawingCoords.x2 - drawingCoords.x1, 2) +
                  Math.pow(drawingCoords.y2 - drawingCoords.y1, 2)
              )
            )}{" "}
            pixels
          </div>
        )}
      </div>

      <button
        onClick={applyDrawing}
        disabled={processing}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-600 font-medium text-sm"
      >
        {processing ? "Drawing..." : "Apply Drawing"}
      </button>
    </div>
  );
}

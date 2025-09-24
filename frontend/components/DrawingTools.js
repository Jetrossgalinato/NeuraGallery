"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function DrawingTools({ image, onProcessed, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [drawingTool, setDrawingTool] = useState("line");
  const [drawingColor, setDrawingColor] = useState("#FF0000");
  const [drawingThickness, setDrawingThickness] = useState(2);
  const [drawingText, setDrawingText] = useState("Sample Text");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [drawnShapes, setDrawnShapes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Get canvas coordinates relative to image
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  // Handle mouse/touch events for drawing
  const handleStart = (e) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e.touches ? e.touches[0] : e);

    if (drawingTool === "text") {
      // For text, just set position on click
      const text = prompt("Enter text to draw:", drawingText);
      if (text) {
        const newShape = {
          type: "text",
          text: text,
          x: coords.x,
          y: coords.y,
          color: drawingColor,
          thickness: drawingThickness,
        };
        setDrawnShapes((prev) => [...prev, newShape]);
        drawOnCanvas();
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentPoint(coords);
  };

  const handleMove = (e) => {
    if (!isDrawing || drawingTool === "text") return;

    e.preventDefault();
    const coords = getCanvasCoordinates(e.touches ? e.touches[0] : e);
    setCurrentPoint(coords);
    drawOnCanvas();
  };

  const handleEnd = (e) => {
    if (!isDrawing) return;

    e.preventDefault();
    setIsDrawing(false);

    if (
      startPoint &&
      currentPoint &&
      (startPoint.x !== currentPoint.x || startPoint.y !== currentPoint.y)
    ) {
      const newShape = {
        type: drawingTool,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: currentPoint.x,
        endY: currentPoint.y,
        color: drawingColor,
        thickness: drawingThickness,
      };

      setDrawnShapes((prev) => [...prev, newShape]);
    }

    setStartPoint(null);
    setCurrentPoint(null);
  };

  // Draw shapes on canvas
  const drawOnCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing shapes
    drawnShapes.forEach((shape) => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.thickness;
      ctx.fillStyle = shape.color;

      if (shape.type === "line") {
        ctx.beginPath();
        ctx.moveTo(shape.startX, shape.startY);
        ctx.lineTo(shape.endX, shape.endY);
        ctx.stroke();
      } else if (shape.type === "rectangle") {
        ctx.strokeRect(
          shape.startX,
          shape.startY,
          shape.endX - shape.startX,
          shape.endY - shape.startY
        );
      } else if (shape.type === "circle") {
        const radius = Math.sqrt(
          Math.pow(shape.endX - shape.startX, 2) +
            Math.pow(shape.endY - shape.startY, 2)
        );
        ctx.beginPath();
        ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (shape.type === "text") {
        ctx.font = `${shape.thickness * 10}px Arial`;
        ctx.fillText(shape.text, shape.x, shape.y);
      }
    });

    // Draw current shape being drawn
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = drawingThickness;

      if (drawingTool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      } else if (drawingTool === "rectangle") {
        ctx.strokeRect(
          startPoint.x,
          startPoint.y,
          currentPoint.x - startPoint.x,
          currentPoint.y - startPoint.y
        );
      } else if (drawingTool === "circle") {
        const radius = Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) +
            Math.pow(currentPoint.y - startPoint.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  // Setup canvas when image loads
  useEffect(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;

    if (img && canvas) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawOnCanvas();
    }
  }, [
    drawnShapes,
    isDrawing,
    startPoint,
    currentPoint,
    drawingColor,
    drawingThickness,
  ]);

  // Function to open the confirmation modal
  const showConfirmationModal = () => {
    if (drawnShapes.length === 0) {
      alert("Please draw something first!");
      return;
    }
    setShowModal(true);
  };

  // Function to handle the actual drawing application
  const handleApplyDrawing = async (createCopy = true) => {
    setProcessing(true);
    try {
      // Get a fresh token
      const token = localStorage.getItem("token");

      // If token is not found, alert user
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        if (onClose) onClose();
        return;
      }

      console.log(
        "Token from localStorage:",
        token ? `${token.substring(0, 10)}...` : "No token found"
      );

      // Apply each shape to the backend
      for (const shape of drawnShapes) {
        // Convert hex color to RGB
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
              }
            : { r: 255, g: 0, b: 0 };
        };

        const color = hexToRgb(shape.color);

        // Build query parameters based on shape type
        let params = new URLSearchParams({
          shape_type: shape.type,
          color_r: color.r.toString(),
          color_g: color.g.toString(),
          color_b: color.b.toString(),
          thickness: shape.thickness.toString(),
          create_copy: createCopy ? "true" : "false",
        });

        console.log("API Request create_copy value:", createCopy);

        if (shape.type === "text") {
          params.append("start_x", shape.x.toString());
          params.append("start_y", shape.y.toString());
          params.append("text", shape.text);
          params.append("font_size", "1.0");
        } else {
          params.append("start_x", shape.startX.toString());
          params.append("start_y", shape.startY.toString());

          if (shape.type === "circle") {
            const radius = Math.round(
              Math.sqrt(
                Math.pow(shape.endX - shape.startX, 2) +
                  Math.pow(shape.endY - shape.startY, 2)
              )
            );
            params.append("radius", radius.toString());
          } else {
            params.append("end_x", shape.endX.toString());
            params.append("end_y", shape.endY.toString());
          }
        }

        // Save the response from the last shape as it will contain the new image ID if create_copy is true
        // First remove create_copy from params
        params.delete("create_copy");

        // Add create_copy directly to URL in a format FastAPI expects
        const createCopyValue = createCopy ? 1 : 0; // Use 1/0 which FastAPI can parse more reliably
        const apiUrl = `http://localhost:8000/image/${
          image.id
        }/draw?${params.toString()}&create_copy=${createCopyValue}`;
        console.log("API URL:", apiUrl);

        try {
          // Make sure token is valid
          if (token === null || token === undefined || token === "") {
            throw new Error("Authentication token is missing");
          }

          const response = await axios.post(
            apiUrl,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
                // Add explicit content type and cache control
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
              },
            }
          );
          console.log("API Response:", response.data);
        } catch (error) {
          console.error("API Call Error:", error);
          console.error("Error Response:", error.response?.data);
          console.error("Error Status:", error.response?.status);

          // If 401 error, suggest token refresh
          if (error.response?.status === 401) {
            console.error("Authentication error - token may be expired");
            // Try to refresh the page to get a new token
            if (
              confirm(
                "Your session has expired. Would you like to refresh the page to login again?"
              )
            ) {
              window.location.reload();
              return; // Stop execution
            }
          }

          throw error; // Re-throw to be caught by outer try/catch
        }
      }

      const actionType = createCopy
        ? "created a copy with"
        : "updated the original image with";
      alert(`Successfully ${actionType} ${drawnShapes.length} shapes drawn.`);

      // Make a request to get the latest images to get the new image info
      const latestImagesResponse = await axios.get(
        `http://localhost:8000/my-images`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // If we created a copy, the new image will be the first in the list
      const newImageData = createCopy ? latestImagesResponse.data[0] : null;

      // Pass back information about the drawing operation
      if (onProcessed) {
        onProcessed({
          success: true,
          createCopy: createCopy,
          shapesCount: drawnShapes.length,
          originalImage: image,
          newImage: newImageData, // Include the new image data if a copy was created
          message: `Successfully ${actionType} ${drawnShapes.length} shapes`,
          shouldRefreshGallery: true, // Signal that the gallery should be refreshed
        });
      }

      if (onClose) onClose();
    } catch (error) {
      console.error("Error applying drawing:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Unknown error occurred";
      alert(`Failed to apply drawing: ${errorMessage}`);
    } finally {
      setProcessing(false);
      setShowModal(false);
    }
  };

  // Function for the Apply Drawing button
  const applyDrawing = () => {
    showConfirmationModal();
  };

  const clearCanvas = () => {
    setDrawnShapes([]);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  return (
    <div className="space-y-4 pb-8 mb-4">
      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-lg font-medium text-white">Apply Drawing</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Would you like to update the original image or create a new copy
              with the drawing?
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowModal(false)}
                className="modal-button modal-button-secondary"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={() => handleApplyDrawing(false)}
                className="modal-button modal-button-secondary"
                disabled={processing}
              >
                Update Original
              </button>
              <button
                onClick={() => handleApplyDrawing(true)}
                className="modal-button modal-button-primary"
                disabled={processing}
              >
                Create Copy
              </button>
            </div>
          </div>
        </div>
      )}

      <h4 className="text-sm font-medium text-gray-300 flex items-center">
        <span className="text-lg mr-2">✏️</span>
        Interactive Drawing Tools
      </h4>

      {/* Drawing Canvas */}
      <div className="drawing-canvas border border-gray-600 rounded-lg overflow-hidden bg-black">
        <img
          ref={imageRef}
          src={`http://localhost:8000/uploads/${image.filename}`}
          alt={image.original_filename}
          onLoad={() => {
            const canvas = canvasRef.current;
            const img = imageRef.current;
            if (canvas && img) {
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              drawOnCanvas();
            }
          }}
        />
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{ touchAction: "none" }}
        />
      </div>

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
            <label className="text-sm text-gray-300">
              {drawingTool === "text" ? "Font Size" : "Thickness"}
            </label>
            <span className="text-xs text-gray-400">
              {drawingTool === "text"
                ? `${drawingThickness * 10}px`
                : `${drawingThickness}px`}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max={drawingTool === "text" ? "5" : "20"}
            value={drawingThickness}
            onChange={(e) => setDrawingThickness(parseInt(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {drawingTool === "text" && (
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Default Text</label>
            <input
              type="text"
              value={drawingText}
              onChange={(e) => setDrawingText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
              placeholder="Enter default text"
            />
            <p className="text-xs text-gray-500">
              Click on the image to place text (you can edit it when clicking)
            </p>
          </div>
        )}

        {drawnShapes.length > 0 && (
          <div className="text-xs text-gray-400 bg-gray-800 rounded p-2">
            <div className="flex items-center justify-between">
              <span>{drawnShapes.length} shape(s) drawn</span>
              <button
                onClick={clearCanvas}
                className="text-red-400 hover:text-red-300 text-xs underline"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={applyDrawing}
          disabled={processing || drawnShapes.length === 0}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-600 font-medium text-sm"
        >
          {processing
            ? "Applying Drawing..."
            : `Apply Drawing (${drawnShapes.length} shapes)`}
        </button>

        <p className="text-xs text-gray-500 text-center">
          {drawingTool === "text"
            ? "Click on image to place text"
            : "Click and drag on image to draw shapes"}
        </p>
        {drawnShapes.length > 0 && (
          <p className="text-xs text-blue-400 text-center">
            When applied, you'll have the option to update the original or
            create a copy
          </p>
        )}
      </div>
    </div>
  );
}

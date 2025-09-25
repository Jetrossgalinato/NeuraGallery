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
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // tl, tr, bl, br, r (radius)
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [mode, setMode] = useState("draw"); // "draw", "interact"

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

  // Check if point is inside a rectangle shape
  const isPointInRectangle = (point, shape) => {
    const minX = Math.min(shape.startX, shape.endX);
    const maxX = Math.max(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const maxY = Math.max(shape.startY, shape.endY);

    return (
      point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
    );
  };

  // Check if point is inside a circle shape
  const isPointInCircle = (point, shape) => {
    const radius = Math.sqrt(
      Math.pow(shape.endX - shape.startX, 2) +
        Math.pow(shape.endY - shape.startY, 2)
    );
    const distance = Math.sqrt(
      Math.pow(point.x - shape.startX, 2) + Math.pow(point.y - shape.startY, 2)
    );

    return distance <= radius;
  };

  // Check if point is near text (using a proximity threshold)
  const isPointNearText = (point, shape) => {
    const textWidth = shape.thickness * 10 * shape.text.length * 0.6;
    const textHeight = shape.thickness * 10;

    return (
      point.x >= shape.x &&
      point.x <= shape.x + textWidth &&
      point.y >= shape.y - textHeight &&
      point.y <= shape.y
    );
  };

  // Check if point is near a line
  const isPointNearLine = (point, shape, threshold = 5) => {
    // Linear algebra to find shortest distance from point to line
    const lineLength = Math.sqrt(
      Math.pow(shape.endX - shape.startX, 2) +
        Math.pow(shape.endY - shape.startY, 2)
    );

    if (lineLength === 0) return false;

    // Calculate distance using the formula for point-to-line distance
    const t =
      ((point.x - shape.startX) * (shape.endX - shape.startX) +
        (point.y - shape.startY) * (shape.endY - shape.startY)) /
      (lineLength * lineLength);

    // If t is outside [0,1], closest point is one of the endpoints
    if (t < 0) {
      const distance = Math.sqrt(
        Math.pow(point.x - shape.startX, 2) +
          Math.pow(point.y - shape.startY, 2)
      );
      return distance <= threshold;
    } else if (t > 1) {
      const distance = Math.sqrt(
        Math.pow(point.x - shape.endX, 2) + Math.pow(point.y - shape.endY, 2)
      );
      return distance <= threshold;
    }

    // Calculate closest point on the line
    const closestX = shape.startX + t * (shape.endX - shape.startX);
    const closestY = shape.startY + t * (shape.endY - shape.startY);

    // Calculate distance to closest point
    const distance = Math.sqrt(
      Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2)
    );

    return distance <= threshold;
  };

  // Find shape under point
  const findShapeAtPoint = (point) => {
    // Search in reverse order (top-most shapes first)
    for (let i = drawnShapes.length - 1; i >= 0; i--) {
      const shape = drawnShapes[i];

      if (shape.type === "rectangle" && isPointInRectangle(point, shape)) {
        return i;
      } else if (shape.type === "circle" && isPointInCircle(point, shape)) {
        return i;
      } else if (shape.type === "text" && isPointNearText(point, shape)) {
        return i;
      } else if (shape.type === "line" && isPointNearLine(point, shape)) {
        return i;
      }
    }

    return null;
  };

  // Check if point is near a resize handle for the selected shape
  const getResizeHandleAtPoint = (point, shapeIndex) => {
    if (shapeIndex === null) return null;

    const shape = drawnShapes[shapeIndex];
    const handleRadius = 8; // Size of the resize handle hitbox

    if (shape.type === "rectangle") {
      // Check corners: top-left, top-right, bottom-left, bottom-right
      const minX = Math.min(shape.startX, shape.endX);
      const maxX = Math.max(shape.startX, shape.endX);
      const minY = Math.min(shape.startY, shape.endY);
      const maxY = Math.max(shape.startY, shape.endY);

      // Top-left
      if (
        Math.sqrt(Math.pow(point.x - minX, 2) + Math.pow(point.y - minY, 2)) <=
        handleRadius
      ) {
        return "tl";
      }

      // Top-right
      if (
        Math.sqrt(Math.pow(point.x - maxX, 2) + Math.pow(point.y - minY, 2)) <=
        handleRadius
      ) {
        return "tr";
      }

      // Bottom-left
      if (
        Math.sqrt(Math.pow(point.x - minX, 2) + Math.pow(point.y - maxY, 2)) <=
        handleRadius
      ) {
        return "bl";
      }

      // Bottom-right
      if (
        Math.sqrt(Math.pow(point.x - maxX, 2) + Math.pow(point.y - maxY, 2)) <=
        handleRadius
      ) {
        return "br";
      }
    } else if (shape.type === "circle") {
      // For circle, check if we're on the radius handle
      const radius = Math.sqrt(
        Math.pow(shape.endX - shape.startX, 2) +
          Math.pow(shape.endY - shape.startY, 2)
      );

      if (
        Math.abs(
          Math.sqrt(
            Math.pow(point.x - shape.endX, 2) +
              Math.pow(point.y - shape.endY, 2)
          )
        ) <= handleRadius
      ) {
        return "r"; // Radius handle
      }
    } else if (shape.type === "line") {
      // Check if near the endpoints
      if (
        Math.sqrt(
          Math.pow(point.x - shape.startX, 2) +
            Math.pow(point.y - shape.startY, 2)
        ) <= handleRadius
      ) {
        return "start";
      }

      if (
        Math.sqrt(
          Math.pow(point.x - shape.endX, 2) + Math.pow(point.y - shape.endY, 2)
        ) <= handleRadius
      ) {
        return "end";
      }
    } else if (shape.type === "text") {
      // Resize handle in the bottom-right for text
      const textWidth = shape.thickness * 10 * shape.text.length * 0.6;
      const textHeight = shape.thickness * 10;

      if (
        Math.sqrt(
          Math.pow(point.x - (shape.x + textWidth), 2) +
            Math.pow(point.y - shape.y, 2)
        ) <= handleRadius
      ) {
        return "br";
      }
    }

    return null;
  };

  // Handle mouse/touch events for drawing
  const handleStart = (e) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e.touches ? e.touches[0] : e);

    if (mode === "interact") {
      // First check if we're on a resize handle of the selected shape
      if (selectedShapeIndex !== null) {
        const handle = getResizeHandleAtPoint(coords, selectedShapeIndex);
        if (handle) {
          setResizeHandle(handle);
          setIsResizing(true);
          return;
        }
      }

      // If not on a resize handle, check if we're clicking on a shape
      const shapeIndex = findShapeAtPoint(coords);

      if (shapeIndex !== null) {
        setSelectedShapeIndex(shapeIndex);

        const shape = drawnShapes[shapeIndex];

        // Calculate offset for moving based on shape type
        if (shape.type === "text") {
          setMoveOffset({
            x: coords.x - shape.x,
            y: coords.y - shape.y,
          });
        } else if (shape.type === "line") {
          // For lines, use the midpoint as reference
          const midX = (shape.startX + shape.endX) / 2;
          const midY = (shape.startY + shape.endY) / 2;
          setMoveOffset({
            x: coords.x - midX,
            y: coords.y - midY,
          });
        } else {
          // For rectangle and circle
          setMoveOffset({
            x: coords.x - shape.startX,
            y: coords.y - shape.startY,
          });
        }

        setIsMoving(true);
      } else {
        setSelectedShapeIndex(null);
      }
      return;
    }

    // Drawing mode
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

        // Automatically select the new text element
        setSelectedShapeIndex(drawnShapes.length);
        setMode("interact");

        drawOnCanvas();
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentPoint(coords);
  };

  const handleMove = (e) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e.touches ? e.touches[0] : e);

    if (isResizing && selectedShapeIndex !== null) {
      // Resizing a selected shape
      const shape = { ...drawnShapes[selectedShapeIndex] };

      if (shape.type === "rectangle") {
        // Handle rectangle resizing based on which corner is being dragged
        if (resizeHandle === "tl") {
          shape.startX = coords.x;
          shape.startY = coords.y;
        } else if (resizeHandle === "tr") {
          shape.endX = coords.x;
          shape.startY = coords.y;
        } else if (resizeHandle === "bl") {
          shape.startX = coords.x;
          shape.endY = coords.y;
        } else if (resizeHandle === "br") {
          shape.endX = coords.x;
          shape.endY = coords.y;
        }
      } else if (shape.type === "circle") {
        if (resizeHandle === "r") {
          // Update the radius by changing the end point
          shape.endX = coords.x;
          shape.endY = coords.y;
        }
      } else if (shape.type === "line") {
        if (resizeHandle === "start") {
          shape.startX = coords.x;
          shape.startY = coords.y;
        } else if (resizeHandle === "end") {
          shape.endX = coords.x;
          shape.endY = coords.y;
        }
      } else if (shape.type === "text") {
        if (resizeHandle === "br") {
          // Resize text by changing thickness based on drag distance
          const origTextWidth = shape.thickness * 10 * shape.text.length * 0.6;
          const newWidth = coords.x - shape.x;

          if (newWidth > 0) {
            // Calculate new thickness based on width
            const newThickness = Math.max(
              1,
              Math.min(5, newWidth / (shape.text.length * 0.6) / 10)
            );
            shape.thickness = newThickness;
          }
        }
      }

      // Update the shape in the shapes array
      const updatedShapes = [...drawnShapes];
      updatedShapes[selectedShapeIndex] = shape;
      setDrawnShapes(updatedShapes);

      drawOnCanvas();
      return;
    }

    if (isMoving && selectedShapeIndex !== null) {
      // Moving a selected shape
      const shape = { ...drawnShapes[selectedShapeIndex] };
      const newX = coords.x - moveOffset.x;
      const newY = coords.y - moveOffset.y;

      if (shape.type === "text") {
        // Update text position
        shape.x = newX;
        shape.y = newY;
      } else if (shape.type === "line") {
        // Calculate how much the shape moved
        const deltaX =
          coords.x - ((shape.startX + shape.endX) / 2 + moveOffset.x);
        const deltaY =
          coords.y - ((shape.startY + shape.endY) / 2 + moveOffset.y);

        // Move both endpoints
        shape.startX += deltaX;
        shape.startY += deltaY;
        shape.endX += deltaX;
        shape.endY += deltaY;
      } else if (shape.type === "rectangle" || shape.type === "circle") {
        // Calculate how much the shape moved
        const deltaX = newX - shape.startX;
        const deltaY = newY - shape.startY;

        // Update start and end coordinates
        shape.startX = newX;
        shape.startY = newY;
        shape.endX = shape.endX + deltaX;
        shape.endY = shape.endY + deltaY;
      }

      // Update the shape in the shapes array
      const updatedShapes = [...drawnShapes];
      updatedShapes[selectedShapeIndex] = shape;
      setDrawnShapes(updatedShapes);

      drawOnCanvas();
      return;
    }

    if (!isDrawing) return;

    setCurrentPoint(coords);
    drawOnCanvas();
  };

  const handleEnd = (e) => {
    e.preventDefault();

    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      return;
    }

    if (isMoving) {
      setIsMoving(false);
      return;
    }

    if (!isDrawing) return;

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

      // Automatically select the new shape and switch to interact mode
      setSelectedShapeIndex(drawnShapes.length);
      setMode("interact");
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
    drawnShapes.forEach((shape, index) => {
      const isSelected = index === selectedShapeIndex;

      // Set styles based on shape properties
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.thickness;
      ctx.fillStyle = shape.color;

      // Draw the shape
      if (shape.type === "line") {
        ctx.beginPath();
        ctx.moveTo(shape.startX, shape.startY);
        ctx.lineTo(shape.endX, shape.endY);
        ctx.stroke();

        // Draw selection handles if selected
        if (isSelected) {
          // Draw selection outline
          ctx.save();
          ctx.strokeStyle = "#00AAFF";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(shape.startX, shape.startY);
          ctx.lineTo(shape.endX, shape.endY);
          ctx.stroke();
          ctx.restore();

          // Draw endpoint handles
          ctx.save();
          ctx.fillStyle = "#00AAFF";
          // Start point handle
          ctx.beginPath();
          ctx.arc(shape.startX, shape.startY, 6, 0, 2 * Math.PI);
          ctx.fill();
          // End point handle
          ctx.beginPath();
          ctx.arc(shape.endX, shape.endY, 6, 0, 2 * Math.PI);
          ctx.fill();
          // Midpoint for moving
          ctx.beginPath();
          ctx.arc(
            (shape.startX + shape.endX) / 2,
            (shape.startY + shape.endY) / 2,
            8,
            0,
            2 * Math.PI
          );
          ctx.stroke();
          ctx.restore();
        }
      } else if (shape.type === "rectangle") {
        ctx.strokeRect(
          shape.startX,
          shape.startY,
          shape.endX - shape.startX,
          shape.endY - shape.startY
        );

        // Draw selection handles if selected
        if (isSelected) {
          const minX = Math.min(shape.startX, shape.endX);
          const maxX = Math.max(shape.startX, shape.endX);
          const minY = Math.min(shape.startY, shape.endY);
          const maxY = Math.max(shape.startY, shape.endY);

          // Draw selection outline
          ctx.save();
          ctx.strokeStyle = "#00AAFF";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            minX - 5,
            minY - 5,
            maxX - minX + 10,
            maxY - minY + 10
          );
          ctx.restore();

          // Draw corner handles for resizing
          ctx.save();
          ctx.fillStyle = "#00AAFF";

          // Top-left handle
          ctx.beginPath();
          ctx.arc(minX, minY, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Top-right handle
          ctx.beginPath();
          ctx.arc(maxX, minY, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Bottom-left handle
          ctx.beginPath();
          ctx.arc(minX, maxY, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Bottom-right handle
          ctx.beginPath();
          ctx.arc(maxX, maxY, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Center handle for moving
          ctx.beginPath();
          ctx.arc((minX + maxX) / 2, (minY + maxY) / 2, 8, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.restore();
        }
      } else if (shape.type === "circle") {
        const radius = Math.sqrt(
          Math.pow(shape.endX - shape.startX, 2) +
            Math.pow(shape.endY - shape.startY, 2)
        );
        ctx.beginPath();
        ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw selection handles if selected
        if (isSelected) {
          // Draw selection outline
          ctx.save();
          ctx.strokeStyle = "#00AAFF";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(shape.startX, shape.startY, radius + 5, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.restore();

          // Draw center handle for moving
          ctx.save();
          ctx.fillStyle = "#00AAFF";
          ctx.beginPath();
          ctx.arc(shape.startX, shape.startY, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Draw radius handle for resizing
          ctx.beginPath();
          ctx.arc(shape.endX, shape.endY, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Line from center to radius point
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(shape.startX, shape.startY);
          ctx.lineTo(shape.endX, shape.endY);
          ctx.stroke();

          ctx.restore();
        }
      } else if (shape.type === "text") {
        ctx.font = `${shape.thickness * 10}px Arial`;
        ctx.fillText(shape.text, shape.x, shape.y);

        // Draw selection handles if selected
        if (isSelected) {
          const textWidth = shape.thickness * 10 * shape.text.length * 0.6;
          const textHeight = shape.thickness * 10;

          // Draw selection outline
          ctx.save();
          ctx.strokeStyle = "#00AAFF";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            shape.x - 5,
            shape.y - textHeight - 5,
            textWidth + 10,
            textHeight + 10
          );
          ctx.restore();

          // Draw handle at text position for moving
          ctx.save();
          ctx.fillStyle = "#00AAFF";
          ctx.beginPath();
          ctx.arc(shape.x, shape.y - textHeight / 2, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Draw resize handle at bottom-right
          ctx.beginPath();
          ctx.arc(shape.x + textWidth, shape.y, 6, 0, 2 * Math.PI);
          ctx.fill();

          ctx.restore();
        }
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
    selectedShapeIndex,
    isMoving,
    isResizing,
    resizeHandle,
    mode,
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

      {/* Mode Toggle */}
      <div className="flex justify-center mb-3">
        <div className="bg-gray-800 p-1 rounded-lg flex">
          <button
            onClick={() => setMode("draw")}
            className={`px-4 py-2 rounded-lg ${
              mode === "draw"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Draw ✏️
          </button>
          <button
            onClick={() => setMode("interact")}
            className={`px-4 py-2 rounded-lg ${
              mode === "interact"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Edit 🖐️
          </button>
        </div>
      </div>

      {/* Drawing Tool Selection */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: "line", label: "Line", icon: "📏" },
          { value: "rectangle", label: "Rectangle", icon: "▭" },
          { value: "circle", label: "Circle", icon: "⭕" },
          { value: "text", label: "Text", icon: "📝" },
        ].map((tool) => (
          <button
            key={tool.value}
            onClick={() => {
              setDrawingTool(tool.value);
              if (mode !== "draw") {
                setMode("draw");
              }
              setSelectedShapeIndex(null);
            }}
            className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${
              drawingTool === tool.value && mode === "draw"
                ? "border-blue-400 bg-gray-700 text-blue-400"
                : "border-gray-600 hover:border-gray-400 text-gray-300"
            }`}
            disabled={mode !== "draw"}
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
          {mode === "draw"
            ? drawingTool === "text"
              ? "Click on image to place text"
              : "Click and drag on image to draw shapes"
            : "Click on any shape to select, then drag to move or resize using the handles"}
        </p>
        {mode === "interact" && selectedShapeIndex !== null && (
          <p className="text-xs text-green-400 text-center">
            Shape selected! Blue handles let you move and resize
          </p>
        )}
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

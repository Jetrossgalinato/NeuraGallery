"use client";

import { useState } from "react";
import axios from "axios";
import DrawingTools from "./DrawingTools";
import TransformTools from "./TransformTools";
import ResizeTools from "./ResizeTools";
import ScaleTools from "./ScaleTools";
import CropTools from "./CropTools";
import "../styles/ImageEditor.css";

export default function ImageEditor({ image, onClose, onProcessed }) {
  // Advanced tool selector state
  const [selectedAdvancedTool, setSelectedAdvancedTool] = useState("drawing");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("adjust"); // adjust, filters, advanced, details

  // Adjustment values - centered at 0
  const [brightness, setBrightness] = useState(0); // -100 to +100
  const [contrast, setContrast] = useState(0); // -100 to +100
  const [saturation, setSaturation] = useState(0); // -100 to +100
  const [hue, setHue] = useState(0); // -30 to +30

  // Filter preview
  const [activeFilter, setActiveFilter] = useState(null);

  // Image details
  const [dimensions, setDimensions] = useState(null);
  const [loadingDimensions, setLoadingDimensions] = useState(false);

  // Auto-load dimensions when advanced tab is selected
  const handleTabChange = async (tabId) => {
    setActiveTab(tabId);
    if (tabId === "advanced" && !dimensions) {
      await getDimensions();
    }
  };

  const getDimensions = async () => {
    setLoadingDimensions(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8000/image/${image.id}/dimensions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDimensions(response.data);
    } catch (error) {
      console.error("Error getting dimensions:", error);
    } finally {
      setLoadingDimensions(false);
    }
  };

  const applyDrawing = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      const drawingData = {
        shape_type: drawingTool,
        coordinates:
          drawingTool === "text"
            ? [drawingCoords.x1, drawingCoords.y1]
            : [
                drawingCoords.x1,
                drawingCoords.y1,
                drawingCoords.x2,
                drawingCoords.y2,
              ],
        color: drawingColor,
        thickness: drawingThickness,
        text: drawingTool === "text" ? drawingText : undefined,
      };

      const response = await axios.post(
        `http://localhost:8000/image/${image.id}/draw`,
        drawingData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Drawing applied! File: ${response.data.processed_filename}`);
      if (onProcessed) onProcessed();
      onClose();
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

  const applyTransform = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `http://localhost:8000/image/${image.id}/transform`,
        {
          translate_x: transformParams.translateX,
          translate_y: transformParams.translateY,
          rotation_angle: transformParams.rotation,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Transform applied! File: ${response.data.processed_filename}`);
      if (onProcessed) onProcessed();
      onClose();
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

  const applyResize = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `http://localhost:8000/image/${image.id}/resize`,
        {
          new_width: parseInt(resizeParams.width),
          new_height: parseInt(resizeParams.height),
          interpolation: resizeParams.interpolation,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Resize applied! File: ${response.data.processed_filename}`);
      if (onProcessed) onProcessed();
      onClose();
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

  const applyScale = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `http://localhost:8000/image/${image.id}/scale`,
        {
          scale_x: parseFloat(scaleParams.scaleX),
          scale_y: parseFloat(scaleParams.scaleY),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Scale applied! File: ${response.data.processed_filename}`);
      if (onProcessed) onProcessed();
      onClose();
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

  const applyCrop = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `http://localhost:8000/image/${image.id}/crop`,
        {
          x: parseInt(cropParams.x),
          y: parseInt(cropParams.y),
          width: parseInt(cropParams.width),
          height: parseInt(cropParams.height),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Crop applied! File: ${response.data.processed_filename}`);
      if (onProcessed) onProcessed();
      onClose();
    } catch (error) {
      console.error("Error applying crop:", error);
      alert(
        `Failed to apply crop: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setProcessing(false);
    }
  };

  const applyAdjustments = async () => {
    if (brightness === 0 && contrast === 0 && saturation === 0 && hue === 0) {
      return; // No changes to apply
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      // Convert percentage values to backend scale with proper clamping
      const brightnessScale = Math.max(
        0.1,
        Math.min(3.0, 1.0 + brightness / 100)
      ); // 0.1 to 3.0
      const contrastScale = Math.max(0.1, Math.min(3.0, 1.0 + contrast / 100)); // 0.1 to 3.0
      const saturationScale = Math.max(
        0.0,
        Math.min(3.0, 1.0 + saturation / 100)
      ); // 0.0 to 3.0      // Use the new quick-adjust endpoint
      const response = await axios.post(
        `http://localhost:8000/image/${image.id}/quick-adjust?brightness=${brightnessScale}&contrast=${contrastScale}&saturation=${saturationScale}&hue_shift=${hue}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Adjustments applied! File: ${response.data.processed_filename}`);
      if (onProcessed) onProcessed();
      onClose();
    } catch (error) {
      console.error("Error applying adjustments:", error);
      alert(
        `Failed to apply adjustments: ${
          error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setProcessing(false);
    }
  };

  const applyFilter = async (filterType) => {
    if (!filterType) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      let response;

      switch (filterType) {
        case "grayscale":
          response = await axios.post(
            `http://localhost:8000/image/${image.id}/grayscale`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        case "vivid":
          response = await axios.post(
            `http://localhost:8000/image/${image.id}/hsv-adjust?hue_shift=0&saturation_scale=1.4&value_scale=1.1`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        case "cool":
          response = await axios.post(
            `http://localhost:8000/image/${image.id}/hsv-adjust?hue_shift=15&saturation_scale=0.8&value_scale=1.0`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        case "warm":
          response = await axios.post(
            `http://localhost:8000/image/${image.id}/hsv-adjust?hue_shift=-15&saturation_scale=1.2&value_scale=1.0`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
      }

      alert(
        `${filterType} filter applied! File: ${response.data.processed_filename}`
      );
      if (onProcessed) onProcessed();
      onClose();
    } catch (error) {
      console.error("Error applying filter:", error);
      alert(
        `Failed to apply filter: ${
          error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setProcessing(false);
    }
  };

  const resetAdjustments = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setHue(0);
    setActiveFilter(null);
  };

  const getFilterStyles = (filterType) => {
    switch (filterType) {
      case "grayscale":
        return "grayscale(100%)";
      case "vivid":
        return "saturate(1.4) brightness(1.1)";
      case "cool":
        return "hue-rotate(15deg) saturate(0.8)";
      case "warm":
        return "hue-rotate(-15deg) saturate(1.2)";
      default:
        return "";
    }
  };

  const getCurrentFilter = () => {
    if (activeFilter) {
      return getFilterStyles(activeFilter);
    }
    // Convert percentage values to CSS filter values
    const brightnessValue = 1.0 + brightness / 100;
    const contrastValue = 1.0 + contrast / 100;
    const saturationValue = 1.0 + saturation / 100;

    return `brightness(${brightnessValue}) contrast(${contrastValue}) saturate(${saturationValue}) hue-rotate(${hue}deg)`;
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button
          onClick={onClose}
          className="px-4 py-2 text-blue-400 hover:text-blue-300 font-medium"
        >
          Cancel
        </button>
        <h2 className="text-lg font-semibold">Edit</h2>
        <button
          onClick={() => {
            if (activeFilter) {
              applyFilter(activeFilter);
            } else if (activeTab === "adjust") {
              applyAdjustments();
            } else {
              // For advanced tab, let user choose which operation to apply
              // Default to showing a message for now
              if (activeTab === "advanced") {
                alert(
                  "Please use the specific Apply buttons for advanced editing operations"
                );
                return;
              }
              applyAdjustments();
            }
          }}
          disabled={processing}
          className="px-4 py-2 text-blue-400 hover:text-blue-300 font-medium disabled:text-gray-500"
        >
          {processing ? "Saving..." : "Done"}
        </button>
      </div>

      {/* Image Preview */}
      <div className="flex-1 flex items-center justify-center bg-black p-4">
        <img
          src={`http://localhost:8000/uploads/${image.filename}`}
          alt={image.original_filename}
          className="max-w-full max-h-full object-contain rounded-lg"
          style={{
            filter: getCurrentFilter(),
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-gray-900 text-white">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {[
            { id: "adjust", label: "Adjust", icon: "⚪" },
            { id: "filters", label: "Filters", icon: "🎨" },
            { id: "advanced", label: "Advanced", icon: "🔧" },
            { id: "details", label: "Details", icon: "📊" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "adjust" && (
            <div className="space-y-6">
              {/* Adjustment Controls */}
              {[
                {
                  label: "Brightness",
                  value: brightness,
                  setValue: setBrightness,
                  min: -100,
                  max: 100,
                  step: 1,
                  icon: "☀️",
                  unit: "%",
                },
                {
                  label: "Contrast",
                  value: contrast,
                  setValue: setContrast,
                  min: -100,
                  max: 100,
                  step: 1,
                  icon: "◐",
                  unit: "%",
                },
                {
                  label: "Saturation",
                  value: saturation,
                  setValue: setSaturation,
                  min: -100,
                  max: 100,
                  step: 1,
                  icon: "🎨",
                  unit: "%",
                },
                {
                  label: "Warmth",
                  value: hue,
                  setValue: setHue,
                  min: -30,
                  max: 30,
                  step: 1,
                  icon: "🌡️",
                  unit: "°",
                },
              ].map((control) => (
                <div key={control.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{control.icon}</span>
                      <span className="text-sm font-medium text-gray-300">
                        {control.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {control.value >= 0 ? "+" : ""}
                      {control.value}
                      {control.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={control.value}
                    onChange={(e) => {
                      control.setValue(parseInt(e.target.value));
                      setActiveFilter(null); // Clear filter when adjusting manually
                    }}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  {/* Center indicator */}
                  <div className="relative">
                    <div
                      className="absolute w-0.5 h-2 bg-gray-400 -top-3"
                      style={{
                        left: `${
                          ((0 - control.min) / (control.max - control.min)) *
                          100
                        }%`,
                        transform: "translateX(-50%)",
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Reset Button */}
              <button
                onClick={resetAdjustments}
                className="w-full py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
              >
                Reset to Original
              </button>
            </div>
          )}

          {activeTab === "filters" && (
            <div className="space-y-4">
              {/* Filter Preview Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Original", type: null, preview: "📷" },
                  { name: "B&W", type: "grayscale", preview: "⚫" },
                  { name: "Vivid", type: "vivid", preview: "🌈" },
                  { name: "Cool", type: "cool", preview: "❄️" },
                  { name: "Warm", type: "warm", preview: "🔥" },
                ].map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => {
                      setActiveFilter(filter.type);
                      // Reset adjustments when selecting a filter
                      if (filter.type) {
                        setBrightness(0);
                        setContrast(0);
                        setSaturation(0);
                        setHue(0);
                      }
                    }}
                    disabled={processing}
                    className={`flex flex-col items-center p-4 border rounded-lg transition-colors disabled:opacity-50 ${
                      activeFilter === filter.type
                        ? "border-blue-400 bg-gray-700"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-2">{filter.preview}</div>
                    <span className="text-sm text-gray-300">{filter.name}</span>
                  </button>
                ))}
              </div>

              {/* Apply Filter Button */}
              {activeFilter && (
                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={() => applyFilter(activeFilter)}
                    disabled={processing}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-600 font-medium"
                  >
                    {processing
                      ? "Applying..."
                      : `Apply ${
                          activeFilter.charAt(0).toUpperCase() +
                          activeFilter.slice(1)
                        } Filter`}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "advanced" && (
            <div
              className="space-y-6 overflow-y-auto max-h-[60vh] pr-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#4a5568 #1a202c",
              }}
            >
              {/* Tool Cards Selector */}
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "drawing", name: "Drawing Tools", icon: "✏️" },
                    { key: "transform", name: "Transform Tools", icon: "🔄" },
                    { key: "resize", name: "Resize Tools", icon: "📏" },
                    { key: "scale", name: "Scale Tools", icon: "📐" },
                    { key: "crop", name: "Crop Tools", icon: "✂️" },
                  ].map((tool) => (
                    <button
                      key={tool.key}
                      onClick={() => setSelectedAdvancedTool(tool.key)}
                      className={`flex flex-col items-center p-4 border rounded-lg transition-colors disabled:opacity-50 ${
                        selectedAdvancedTool === tool.key
                          ? "border-blue-400 bg-gray-700"
                          : "border-gray-600 hover:border-gray-400"
                      }`}
                    >
                      <div className="text-2xl mb-2">{tool.icon}</div>
                      <span className="text-sm text-gray-300">{tool.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Only show the selected tool */}
              {!dimensions && (
                <button
                  onClick={getDimensions}
                  disabled={loadingDimensions}
                  className="w-full py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
                >
                  {loadingDimensions
                    ? "Loading..."
                    : "📐 Load Image Dimensions"}
                </button>
              )}

              {selectedAdvancedTool === "drawing" && (
                <DrawingTools
                  image={image}
                  onProcessed={onProcessed}
                  onClose={onClose}
                />
              )}
              {selectedAdvancedTool === "transform" && (
                <TransformTools
                  image={image}
                  onProcessed={onProcessed}
                  onClose={onClose}
                />
              )}
              {selectedAdvancedTool === "resize" && (
                <ResizeTools
                  image={image}
                  dimensions={dimensions}
                  onProcessed={onProcessed}
                  onClose={onClose}
                />
              )}
              {selectedAdvancedTool === "scale" && (
                <ScaleTools
                  image={image}
                  onProcessed={onProcessed}
                  onClose={onClose}
                />
              )}
              {selectedAdvancedTool === "crop" && (
                <CropTools
                  image={image}
                  dimensions={dimensions}
                  onProcessed={onProcessed}
                  onClose={onClose}
                />
              )}
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Image Information</h3>
                <button
                  onClick={getDimensions}
                  disabled={loadingDimensions}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 disabled:bg-gray-600"
                >
                  {loadingDimensions ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white text-sm">
                    {image.original_filename}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white text-sm">
                    {Math.round(image.file_size / 1024)} KB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white text-sm">{image.mime_type}</span>
                </div>

                {dimensions && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dimensions:</span>
                      <span className="text-white text-sm">
                        {dimensions.width} × {dimensions.height} px
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Channels:</span>
                      <span className="text-white text-sm">
                        {dimensions.channels}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Pixels:</span>
                      <span className="text-white text-sm">
                        {dimensions.total_pixels.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing Overlay */}
      {processing && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-gray-800 p-6 rounded-2xl text-center">
            <div className="animate-spin w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-white">Processing image...</p>
          </div>
        </div>
      )}
    </div>
  );
}

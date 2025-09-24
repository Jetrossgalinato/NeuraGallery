// This is a wrapper component that modifies the onProcessed function to handle
// image copies properly from DrawingTools.js

import DrawingTools from "./DrawingTools";

export default function DrawingToolsWrapper({ image, onProcessed, onClose }) {
  // Enhanced onProcessed handler that can handle both original updates and new copies
  const handleProcessed = (processedData) => {
    // Call the parent's onProcessed function with the processed data
    // This will allow the parent to refresh or show the new image
    if (onProcessed) {
      onProcessed(processedData);
    }
  };

  return (
    <DrawingTools
      image={image}
      onProcessed={handleProcessed}
      onClose={onClose}
    />
  );
}

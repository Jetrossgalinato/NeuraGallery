class ImageProcessingApp {
  constructor() {
    this.API_BASE = "http://localhost:8000";
    this.currentFileId = null;
    this.currentOperation = null;
    this.operations = {};

    this.initializeElements();
    this.attachEventListeners();
    this.loadOperations();
  }

  initializeElements() {
    this.uploadArea = document.getElementById("uploadArea");
    this.fileInput = document.getElementById("fileInput");
    this.selectFileBtn = document.getElementById("selectFileBtn");
    this.imageSection = document.getElementById("imageSection");
    this.controlsSection = document.getElementById("controlsSection");
    this.originalImage = document.getElementById("originalImage");
    this.processedImageContainer = document.getElementById(
      "processedImageContainer"
    );
    this.parametersContainer = document.getElementById("parametersContainer");
    this.processBtn = document.getElementById("processBtn");
    this.downloadBtn = document.getElementById("downloadBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.statusMessage = document.getElementById("statusMessage");
    this.loadingIndicator = document.getElementById("loadingIndicator");
  }

  attachEventListeners() {
    // File selection
    this.selectFileBtn.addEventListener("click", () => this.selectFile());
    this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e));

    // Drag and drop
    this.uploadArea.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener("dragleave", (e) =>
      this.handleDragLeave(e)
    );
    this.uploadArea.addEventListener("drop", (e) => this.handleDrop(e));
    this.uploadArea.addEventListener("click", () => this.selectFile());

    // Operation buttons
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("operation-btn")) {
        this.selectOperation(e.target.dataset.operation);
      }
    });

    // Control buttons
    this.processBtn.addEventListener("click", () => this.processImage());
    this.downloadBtn.addEventListener("click", () => this.downloadImage());
    this.resetBtn.addEventListener("click", () => this.reset());
  }

  async selectFile() {
    if (window.electronAPI) {
      const result = await window.electronAPI.selectFile();
      if (!result.canceled && result.filePaths.length > 0) {
        this.loadImageFile(result.filePaths[0]);
      }
    } else {
      this.fileInput.click();
    }
  }

  handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
      this.uploadImage(files[0]);
    }
  }

  handleDragOver(event) {
    event.preventDefault();
    this.uploadArea.classList.add("dragover");
  }

  handleDragLeave(event) {
    event.preventDefault();
    this.uploadArea.classList.remove("dragover");
  }

  handleDrop(event) {
    event.preventDefault();
    this.uploadArea.classList.remove("dragover");

    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      this.uploadImage(files[0]);
    }
  }

  async uploadImage(file) {
    try {
      this.showLoading("Uploading image...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${this.API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      this.currentFileId = result.file_id;

      // Display original image
      this.originalImage.src = URL.createObjectURL(file);
      this.showImageSection();

      this.showStatus(
        `Image uploaded successfully: ${result.original_name}`,
        "success"
      );
      this.hideLoading();
    } catch (error) {
      this.showStatus(`Upload failed: ${error.message}`, "error");
      this.hideLoading();
    }
  }

  async loadImageFile(filePath) {
    // This would be used in Electron environment
    // For now, we'll use the file input method
    this.fileInput.click();
  }

  async loadOperations() {
    try {
      const response = await fetch(`${this.API_BASE}/operations`);
      const data = await response.json();
      this.operations = {};

      data.operations.forEach((op) => {
        this.operations[op.name] = op;
      });
    } catch (error) {
      console.error("Failed to load operations:", error);
    }
  }

  selectOperation(operationName) {
    // Update active button
    document.querySelectorAll(".operation-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    const selectedBtn = document.querySelector(
      `[data-operation="${operationName}"]`
    );
    if (selectedBtn) {
      selectedBtn.classList.add("active");
    }

    this.currentOperation = operationName;
    this.buildParameterControls();

    // Show controls section
    this.controlsSection.style.display = "block";

    this.showStatus(`Selected operation: ${operationName}`, "info");
  }

  buildParameterControls() {
    if (!this.currentOperation || !this.operations[this.currentOperation]) {
      this.parametersContainer.innerHTML = "";
      return;
    }

    const operation = this.operations[this.currentOperation];
    this.parametersContainer.innerHTML = "";

    if (!operation.parameters || operation.parameters.length === 0) {
      this.parametersContainer.innerHTML =
        '<p class="no-params">No parameters required for this operation.</p>';
      return;
    }

    operation.parameters.forEach((param) => {
      const paramDiv = document.createElement("div");
      paramDiv.className = "parameter-control";

      const label = document.createElement("label");
      label.textContent = param.label || param.name;
      label.htmlFor = `param_${param.name}`;

      let input;

      switch (param.type) {
        case "range":
        case "slider":
          input = document.createElement("input");
          input.type = "range";
          input.min = param.min || 0;
          input.max = param.max || 100;
          input.step = param.step || 1;
          input.value = param.default || param.min || 0;

          const valueDisplay = document.createElement("span");
          valueDisplay.className = "range-value";
          valueDisplay.textContent = input.value;

          input.addEventListener("input", () => {
            valueDisplay.textContent = input.value;
          });

          paramDiv.appendChild(label);
          paramDiv.appendChild(input);
          paramDiv.appendChild(valueDisplay);
          break;

        case "select":
        case "dropdown":
          input = document.createElement("select");
          param.options.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value || option;
            optionElement.textContent = option.label || option;
            if (option.value === param.default || option === param.default) {
              optionElement.selected = true;
            }
            input.appendChild(optionElement);
          });

          paramDiv.appendChild(label);
          paramDiv.appendChild(input);
          break;

        case "checkbox":
        case "boolean":
          input = document.createElement("input");
          input.type = "checkbox";
          input.checked = param.default || false;

          paramDiv.appendChild(input);
          paramDiv.appendChild(label);
          break;

        case "color":
          input = document.createElement("input");
          input.type = "color";
          input.value = param.default || "#000000";

          paramDiv.appendChild(label);
          paramDiv.appendChild(input);
          break;

        default: // text, number
          input = document.createElement("input");
          input.type = param.type === "number" ? "number" : "text";
          input.value = param.default || "";
          if (param.min !== undefined) input.min = param.min;
          if (param.max !== undefined) input.max = param.max;
          if (param.step !== undefined) input.step = param.step;

          paramDiv.appendChild(label);
          paramDiv.appendChild(input);
          break;
      }

      input.id = `param_${param.name}`;
      input.name = param.name;

      if (param.description) {
        const description = document.createElement("small");
        description.className = "param-description";
        description.textContent = param.description;
        paramDiv.appendChild(description);
      }

      this.parametersContainer.appendChild(paramDiv);
    });
  }

  collectParameters() {
    const parameters = {};
    const paramInputs =
      this.parametersContainer.querySelectorAll("input, select");

    paramInputs.forEach((input) => {
      if (input.name) {
        let value = input.value;

        // Handle different input types
        if (input.type === "checkbox") {
          value = input.checked;
        } else if (input.type === "number" || input.type === "range") {
          value = parseFloat(value);
        }

        parameters[input.name] = value;
      }
    });

    return parameters;
  }

  async processImage() {
    if (!this.currentFileId || !this.currentOperation) {
      this.showStatus("Please select an image and operation first.", "error");
      return;
    }

    try {
      this.showLoading("Processing image...");
      this.processBtn.disabled = true;

      const parameters = this.collectParameters();

      const requestData = {
        file_id: this.currentFileId,
        operation: this.currentOperation,
        parameters: parameters,
      };

      const response = await fetch(`${this.API_BASE}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Processing failed");
      }

      const result = await response.json();

      // Display processed image
      const processedImage = document.createElement("img");
      processedImage.src = `${this.API_BASE}/download/${result.processed_file_id}`;
      processedImage.alt = "Processed Image";
      processedImage.className = "processed-image";

      this.processedImageContainer.innerHTML = "";
      this.processedImageContainer.appendChild(processedImage);

      // Enable download button
      this.downloadBtn.disabled = false;
      this.downloadBtn.dataset.fileId = result.processed_file_id;

      this.showStatus("Image processed successfully!", "success");
    } catch (error) {
      this.showStatus(`Processing failed: ${error.message}`, "error");
    } finally {
      this.hideLoading();
      this.processBtn.disabled = false;
    }
  }

  async downloadImage() {
    const fileId = this.downloadBtn.dataset.fileId;
    if (!fileId) {
      this.showStatus("No processed image to download.", "error");
      return;
    }

    try {
      const response = await fetch(`${this.API_BASE}/download/${fileId}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `processed_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      this.showStatus("Image downloaded successfully!", "success");
    } catch (error) {
      this.showStatus(`Download failed: ${error.message}`, "error");
    }
  }

  reset() {
    // Clear current state
    this.currentFileId = null;
    this.currentOperation = null;

    // Reset UI elements
    this.originalImage.src = "";
    this.processedImageContainer.innerHTML = "";
    this.parametersContainer.innerHTML = "";
    this.fileInput.value = "";

    // Hide sections
    this.imageSection.style.display = "none";
    this.controlsSection.style.display = "none";

    // Reset buttons
    document.querySelectorAll(".operation-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    this.processBtn.disabled = false;
    this.downloadBtn.disabled = true;
    this.downloadBtn.dataset.fileId = "";

    // Clear status
    this.clearStatus();

    this.showStatus("Application reset. Please upload a new image.", "info");
  }

  showImageSection() {
    this.imageSection.style.display = "block";
  }

  showLoading(message = "Loading...") {
    this.loadingIndicator.textContent = message;
    this.loadingIndicator.style.display = "block";
  }

  hideLoading() {
    this.loadingIndicator.style.display = "none";
  }

  showStatus(message, type = "info") {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    this.statusMessage.style.display = "block";

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        this.clearStatus();
      }, 5000);
    }
  }

  clearStatus() {
    this.statusMessage.style.display = "none";
    this.statusMessage.textContent = "";
    this.statusMessage.className = "status-message";
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ImageProcessingApp();
});

const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "src", "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));

  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle file selection dialog
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["jpg", "jpeg", "png", "bmp", "tiff"] },
    ],
  });

  return result;
});

// Handle save dialog
ipcMain.handle("save-file", async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: "Images", extensions: ["jpg", "png"] }],
  });

  return result;
});

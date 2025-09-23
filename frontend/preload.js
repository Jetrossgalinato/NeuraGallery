const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("neura", {
  // Expose safe APIs here
});

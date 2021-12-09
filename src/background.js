"use strict";

import path from "path";
import {
  app,
  protocol,
  BrowserWindow,
  Menu,
  globalShortcut,
  Tray,
  nativeImage,
} from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

let mainWindow;
let tray = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });
}

function registryShortcut() {
  globalShortcut.register("CommandOrControl+J+K", () => {
    BrowserWindow.getFocusedWindow().webContents.openDevTools();
  });
  globalShortcut.register("F5", () => {
    BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
  });
  globalShortcut.register("CommandOrControl+R", () => {
    BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
  });
  globalShortcut.register("CommandOrControl+Shift+K", async () => {
    await BrowserWindow.getFocusedWindow().webContents.session.clearCache();
    await BrowserWindow.getFocusedWindow().webContents.session.clearStorageData();
    BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
  });
}

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    },
    // icon: 'src/assets/icon.ico'
    preload: path.join(__dirname, "preload.js"),
    // icon: '../public/logo.ico'
    icon: nativeImage.createFromPath(getTrayIcon()),
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    // 远程地址写在这
    mainWindow.loadURL(
      process.env.VUE_APP_SITE
        ? process.env.VUE_APP_SITE
        : "https://www.baidu.com"
    );
  }
}

function getTrayIcon() {
  if (process.platform !== "darwin") {
    return path.join(__static, "/logo.ico");
  }
  return path.join(__static, "/tray.png");
}

// 系统托盘初始化
function createTray() {
  tray = new Tray(nativeImage.createFromPath(getTrayIcon()));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "退出",
      click: () => {
        app.exit();
      },
    },
  ]);
  tray.setToolTip(process.env.VUE_APP_NAME);
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  Menu.setApplicationMenu(null);
  createTray();
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  if (!isDevelopment) {
    registryShortcut();
  }
  createWindow();
  mainWindow.on("close", function (e) {
    e.preventDefault();
    mainWindow.hide();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  // if (process.platform !== 'darwin') {
  app.quit();
  // }
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

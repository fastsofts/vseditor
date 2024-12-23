import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as path from 'path'
import * as fs from 'fs'
const { debounce } = require('lodash');
let mainWindow = {}
require('v8-compile-cache');

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const handleWindowResize = debounce(() => {
    const [width, height] = mainWindow.getSize();
    mainWindow.webContents.send('window-size-changed', { width, height });
  }, 100); 
  mainWindow.removeListener('resize', handleWindowResize);
  mainWindow.on('resize', handleWindowResize);

  mainWindow.on('closed', () => {
    mainWindow = {};
  });


  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}


app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  global.mainProcess = {
    loadJson: () => {
      const filePath = path.join(app.getPath('userData'), 'data.json')
      try {
        const jsonData = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(jsonData);
      } catch (error) {
        console.error('Error reading JSON file:', error)
        return {}
      }
    },
    saveJson: (data) => {
      const filePath = path.join(app.getPath('userData'), 'data.json')
      try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
      } catch (error) {
        console.error('Error saving JSON file:', error)
      }
    },
  }
  ipcMain.handle('load-json', async () => {
    return global.mainProcess.loadJson()
  });

  ipcMain.on('save-json', (event, data) => {
    global.mainProcess.saveJson(data)
  })
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})



ipcMain.on('open-folder-dialog', (event) => {
  const { dialog } = require('electron');
  dialog
    .showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })
    .then((result) => {
      event.sender.send('selected-folder', result.filePaths)
    })
    .catch((err) => {
      console.error(err)
    });
})

ipcMain.on('get-folder-content', (event, folderPath) => {
  const content = getFolderContent(folderPath);
  event.sender.send('folder-content', content);
});

function getFolderContent(folderPath: string) {
  try {
    const items = fs.readdirSync(folderPath)
    const content = items.map((item) => {
      const fullPath = path.join(folderPath, item);
      const isDirectory = fs.statSync(fullPath).isDirectory()
      const ftype = isDirectory ? 'folder' : getFileType(fullPath)
      return {
        name: item,
        fullPath,
        isDirectory,
        children: isDirectory ? getFolderContent(fullPath) : null,
        type: ftype,
      }
    })
    return content;
  } catch (error) {
    console.error('Error reading folder content:', error)
    return [];
  }
  return [];
}

function getFileType(filePath: string) {
  const file = filePath.replace(/\\/g, '/').split('/').slice(-1)[0]
  return file.split('.').slice(-1)[0]
}

ipcMain.handle('get-initial-window-size', (event) => {
  const { width, height } = mainWindow.getBounds()
  return { width, height }
})

ipcMain.on('read-file', (event, filePath) => {
  const fs = require('fs');

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      event.sender.send('read-file-reply', err.toString());
    } else {
      event.sender.send('read-file-reply', null, data);
    }
  });
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})



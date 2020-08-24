// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Tray, Menu, clipboard, dialog, screen, globalShortcut } = require('electron')
const path = require('path')

if (!app.requestSingleInstanceLock()) {
    app.quit();
}

let visor = {};

function createWindow(fixedPos) {
    // Create the browser window.

    let p = screen.getCursorScreenPoint();
    let myWidth  = 800;
    let myHeight = 600;

    if (fixedPos)
    {
        p = {};
        p.x = screen.getPrimaryDisplay().size.width - myWidth - 50;
        p.y = screen.getPrimaryDisplay().size.height - myHeight - 50;
    }

    if (visor.mainWindow)
    {
        visor.mainWindow.close();
        visor.mainWindow = null;
    }

    visor.mainWindow = new BrowserWindow({
        width: myWidth,
        height: myHeight,
        x: p.x,
        y: p.y,
        frame: false,
        resizable: true,
        //movable: false,
        minimizable: false,
        maximizable: false,
        //closable: true,
        //show: false, OG
        //show: false,
        title: 'ClipSyne',
        webPreferences: {
            nodeIntegration: true
        }
    });

    visor.mainWindow.setIcon('./icon.png');

    //mainWindow.setMenuBarVisibility(false)
    visor.mainWindow.setMenuBarVisibility(false);

    // and load the index.html of the app.
    visor.mainWindow.loadFile('index.html');

    // Open the DevTools.
    //mainWindow.webContents.openDevTools()

    // visor.mainWindow.on('minimize', (event) => {
    //     event.preventDefault();
    //     mainWindow.hide();
    // });

    visor.mainWindow.on('close', (ev) => {
        //mainWindow.reload();
        // if (!app.isQuiting) {
        //     event.preventDefault();
        //     visor.mainWindow.hide();
        // }

        //return false;

        ev.sender.hide();
        ev.preventDefault(); // prevent quit process
    });

    // globalShortcut.register('CommandOrControl+X', () => {
    //     console.log("shortcut");
    //     alert("bleb");
    //     visor.tray.focus();
    //     visor.mainWindow.show();
    // })

    //globalShortcut.register('CmdOrCtrl+Alt+Left', () => switchKeyboard)

    //setTimeout(() => mainWindow.send('asynchronous-message', clipboard.readText()), 1000)
}

function switchKeyboard() {
    let selection = clipboard.readText('selection');
    console.log(selection);

    clipboard.writeText('111', 'selection');

    selection = clipboard.readText('selection');
    console.log(selection);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.whenReady().then(start)



app.on('ready', () => {

    globalShortcut.register('Ctrl+Shift+U', () => {

        console.log(`visor.mainWindow: ${visor.mainWindow}`);
        console.log(`BrowserWindow.getAllWindows().length: ${BrowserWindow.getAllWindows().length}`);
        // if (visor.mainWindow === null) {
        //     createWindow();
        // }
        // if (BrowserWindow.getAllWindows().length === 0) createWindow();
        createWindow(false);
    });

    visor.tray = new Tray("./icon.png");
    visor.tray.setToolTip('Click to show your clipboard history');

    // const

    const contextMenu = Menu.buildFromTemplate(
        [   {
                label: "Display",
                click: (item, window, event) => {
                    //console.log(item, event);
                    createWindow(true);
                }
            },
            {
                type: "separator"
            },
            {
                label: "Exit",
                role: "quit"
            } // "role": system prepared action menu
        ]);

    //let contextMenu = Menu.buildFromTemplate(template);
    visor.tray.setContextMenu(contextMenu);
    //visor.tray.setImage('./icon.png');

});

// do not quit when all windows are closed
// and continue running on background to listen
// for shortcuts
app.on('window-all-closed', (e) => {
    e.preventDefault();
    e.returnValue = false;
});

app.on('will-quit', () => {
    // Unregister a shortcut.
    globalShortcut.unregister('Ctrl+Shift+U');
    // Unregister all shortcuts.
    globalShortcut.unregisterAll();
  })

// // Quit when all windows are closed.
// app.on('window-all-closed', () => {
//     // On macOS it is common for applications and their menu bar
//     // to stay active until the user quits explicitly with Cmd + Q
//     if (process.platform !== 'darwin') app.quit();
// })



app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (visor.mainWindow === null) {
        createWindow();
    }
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", ev => {
    // BrowserWindow "close" event spawn after quit operation,
    // it requires to clean up listeners for "close" event
    visor.window.removeAllListeners("close");
    // release windows
    visor = null;
});

/*ipcMain.on('asynchronous-message', (event, arg) => {
    console.log(arg) // prints "ping"
    setTimeout(() => event.reply('asynchronous-message', clipboard.readText()), 1000)
})*/
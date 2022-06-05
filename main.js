'use strict';
/* jshint esversion: 11 */
// jshint node: true
// jshint trailingcomma: false
// jshint undef:true
// jshint unused:true
// jshint varstmt:true
// jshint browser: true

const { app, BrowserWindow, ipcMain, Tray, Menu, clipboard, dialog, screen, globalShortcut } = require('electron');
//const { BrowserWindow } = require('@electron/remote');
//const { BrowserWindow } = require('electron');
require('@electron/remote/main').initialize();
const nutjs = require("@nut-tree/nut-js");
// const robot = require('robotjs');
const ffi = require('ffi-napi');
const user32 = new ffi.Library('user32', {
    'GetTopWindow': ['long', ['long']],
    'FindWindowA': ['long', ['string', 'string']],
    'SetActiveWindow': ['long', ['long']],
    'SetForegroundWindow': ['bool', ['long']],
    'BringWindowToTop': ['bool', ['long']],
    'ShowWindow': ['bool', ['long', 'int']],
    'SwitchToThisWindow': ['void', ['long', 'bool']],
    'GetForegroundWindow': ['long', []],
    'AttachThreadInput': ['bool', ['int', 'long', 'bool']],
    'GetWindowThreadProcessId': ['int', ['long', 'int']],
    'SetWindowPos': ['bool', ['long', 'long', 'int', 'int', 'int', 'int', 'uint']],
    'SetFocus': ['long', ['long']]
});
const kernel32 = new ffi.Library('Kernel32.dll', {
    'GetCurrentThreadId': ['int', []]
});
let prevOSProgramInFocus;
const shortcutPopupStr = "Ctrl+Shift+Insert";
let visor = {};
const DEBUG = false;

let targetWindowWidth  = 600;
if (DEBUG)  targetWindowWidth *= 2;
let targetWindowHeight = 500;

console.log("CLIPSYNC 1.7.5");
console.log("Use", shortcutPopupStr, "to open.");

if (!app.requestSingleInstanceLock()) {
    app.quit();
}

app.on('browser-window-blur', function(event, win)
{
    visor.mainWindow.close();
});

function createWindow(fixedPos) {
    // Create the browser window.

    let p = screen.getCursorScreenPoint();

    if (fixedPos)
    {
        p = {};
        let curScreen = screen.getDisplayNearestPoint(p);
        p.x = curScreen.size.width - targetWindowWidth - 40;
        p.y = curScreen.size.height - targetWindowHeight - 40;
    }
    else
    {
        p = calculatePosition();
    }

    visor.mainWindow = new BrowserWindow({
        width: targetWindowWidth,
        height: targetWindowHeight,
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
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    }); 
    require('@electron/remote/main').enable(visor.mainWindow.webContents);
    
    if (DEBUG)
    {
        visor.mainWindow.webContents.openDevTools({detach: true});
    }

    console.log("creating browser window");

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

    visor.mainWindow.on('close', function(ev) {
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

// function switchKeyboard() {
//     let selection = clipboard.readText('selection');
//     console.log(selection);

//     clipboard.writeText('111', 'selection');

//     selection = clipboard.readText('selection');
//     console.log(selection);
// }

function calculatePosition()
{
    let p = screen.getCursorScreenPoint();
    let curScreen = screen.getDisplayNearestPoint(p);
    if ((p.x + targetWindowWidth) > curScreen.workArea.x + curScreen.workArea.width )
    {
        p.x = curScreen.workArea.x + curScreen.workArea.width - targetWindowWidth ;
    }
    if ((p.y + targetWindowHeight) > curScreen.workArea.y + curScreen.workArea.height)
    {
        p.y = curScreen.workArea.y + curScreen.size.height - targetWindowHeight;
    }
    if (p.x < 0)    p.x = 0;
    if (p.y < 0)    p.y = 0;

    return p;
}

app.on('browser-window-focus', function(event, win)
{
    // console.log('FOCUS', win.webContents.id);

    let p = calculatePosition();
    win.webContents.send('focusmsg', p);
    visor.mainWindow.setPosition(p.x, p.y);
});

app.on('browser-window-blur', function(event, win)
{
    if (win.webContents.isDevToolsFocused())
    {
        console.log('Ignore this case');
    }
    else
    {
        //console.log('browser-window-blur', win.webContents.id);
    }
});

app.on('ready', function()
{
    console.log("app ready");
    if (!visor.mainWindow)
        createWindow(false);
    else
        visor.mainWindow.show();
    visor.mainWindow.hide();

    globalShortcut.register(shortcutPopupStr, function()
    {
        prevOSProgramInFocus = user32.GetForegroundWindow();
        // console.log("prevOSProgramInFocus", prevOSProgramInFocus);
        // (async () => {
        //     const windowRef = await nutjs.getActiveWindow();
        //     console.log("windowRef", windowRef);
        //     console.log("windowRef title", windowRef.title);
        //     //IF TITLE INCLUDES KEEPASS
        // })();

        if (!visor.mainWindow)
            createWindow(false);
        else
            visor.mainWindow.show();

        //visor.mainWindow.webContents.send('init');
    });

    visor.tray = new Tray("./icon.png");
    visor.tray.setToolTip('Click to show your clipboard history');

    const contextMenu = Menu.buildFromTemplate(
    [   {
            label: "Display",
            click: function(item, window, event)
            {
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
// and continue running on background to listen for shortcuts
app.on('window-all-closed', function(e)
{
    e.preventDefault();
    e.returnValue = false;
});


// we explicitely dont want this behavior for this project. Should be running and hidden usually.
// app.on('window-all-closed', () => {
     // On macOS it is common for applications and their menu bar
     // to stay active until the user quits explicitly with Cmd + Q
//     if (process.platform !== 'darwin') app.quit();
// })

app.on('activate', function()
{
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    console.log("activate");
    if (visor.mainWindow === null)
    {
        createWindow();
    }
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", function(ev)
{
    console.log("CLOSING CLIPSYNE");

    visor.mainWindow.webContents.send('dbclose', 'closeit');

    // Unregister a shortcut.
    globalShortcut.unregister(shortcutPopupStr);
    // Unregister all shortcuts.
    globalShortcut.unregisterAll();

    visor.mainWindow.removeAllListeners("close");
    visor.mainWindow.destroy();
    visor.mainWindow = null;
    visor = null;
});

ipcMain.on('robot_paste', function(event, arg)
{
    console.log("Incoming ROBOT msg from render to main: ", arg);
    
    setTimeout(() => {
        user32.SetForegroundWindow(prevOSProgramInFocus);

        setTimeout(() => {
            //robot.keyTap('v', process.platform==='darwin' ? 'command' : 'control');
            // nutjs.keyboard.pressKey(nutjs.Key.LeftControl);
            nutjs.keyboard.type(nutjs.Key.LeftControl, nutjs.Key.V);
            // nutjs.keyboard.releaseKey(nutjs.Key.LeftControl);
            //nutjs.mouse.move(nutjs.right(400));

            // async function gg()
            // {
            //     let rr = await nutjs.clipboard.paste();
            //     console.log(rr);
            // }
            // gg();
            
        }, 10);

    }, 10);
    
});

ipcMain.on('main_console', function(event, arg)
{
    console.log(arg);
});

function ipcTest()
{
    ipcMain.on('asynchronous-message', function (event, arg)
    {
        console.log("Incoming async msg from render to main: ", arg);
        event.reply('asynchronous-reply', 'reply from main (async)');
    });
    
    ipcMain.on('synchronous-message', function(event, arg)
    {
        console.log("Incoming sync msg from render to main: ", arg);
        event.returnValue = 'Reply from main (sync)';
    });
}


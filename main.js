'use strict';
/* jshint esversion: 11 */
// jshint node: true
// jshint trailingcomma: false
// jshint undef:true
// jshint unused:true
// jshint varstmt:true
// jshint browser: true

const OS_WINDOWS = (process.platform == "win32" || process.platform == "win64");
const OS_MAC = (process.platform == "darwin");
const OS_LINUX = (process.platform == "linux");
if (OS_WINDOWS)
    console.log(`OPERATING SYSTEM: WINDOWS`);
else if (OS_MAC)
    console.log(`OPERATING SYSTEM: MAC OS`);
else if (OS_LINUX)
    console.log(`OPERATING SYSTEM: LINUX`);

const { app, BrowserWindow, ipcMain, Tray, Menu, clipboard, dialog, screen, globalShortcut } = require('electron');
require('@electron/remote/main').initialize();
const nutjs = require("@nut-tree/nut-js");
const storage = require("./storage");
const shortcutPopupStr = "Ctrl+Shift+Space";
let visor = {};
const DEBUG = false;

let targetWindowWidth  = 340+340;
if (DEBUG)  targetWindowWidth *= 2;
let targetWindowHeight = 400;

console.log("CLIPSYNC 1.7.7");
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
    let curScreen = screen.getDisplayNearestPoint(p);

    if (fixedPos)
    {
        p = {};
        
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
    storage.init();

    //init clipboard monitoring
    let prevClipText = clipboard.readText();
    setInterval(async function() // STORE AUTOMATICALLY
    {
        // console.log((Date.now()/1000 + "\tstore").substring(6, 14));
        if (prevClipText !== clipboard.readText())
        {
            prevClipText = clipboard.readText();

            let lastInsert = storage.raw(0);
            if (lastInsert != prevClipText)
            {
                storage.add(prevClipText);
                //refreshView();
            }
        }
    }, 333);

    
    if (!visor.mainWindow)
        createWindow(false);
    else
        visor.mainWindow.show();
    visor.mainWindow.hide();

    globalShortcut.register("Ctrl+Shift+H", function()
    {
        console.log("Ctrl+Shift+H");
        if (clipboard.readRTF().length > 0)
        {
            //its an RTF
            console.log("RTF Text of length", clipboard.readRTF().length);
            visor.mainWindow.webContents.send('embed', `${clipboard.readHTML()}`);
        }
        else if (clipboard.readText().length > 0)
        {
            //its normal text
            console.log("Normal Text", clipboard.readText());
        }
        else if (clipboard.readImage().getSize().width > 0 || clipboard.readImage().getSize().height)
        {
            //its an image
            console.log("Image of size", clipboard.readImage().getSize());
            console.log("Image ", clipboard.readImage().toDataURL());
            
            
            //visor.mainWindow.webContents.send('pushimg', `<img src='${clipboard.readImage().toDataURL()}' />`);
            visor.mainWindow.webContents.send('embed', `<div class='previewpic' style='background-image: url(${clipboard.readImage().toDataURL()});'></div>`);
        }
        else if (clipboard.readBuffer('FileNameW').toString('ucs2').length > 0)
        {
            //its a file pointer<iframe src="https://archive.org/embed/Popeye_forPresident" 
            let file = "" + clipboard.readBuffer('FileNameW').toString('ucs2');
            console.log(file.includes("�"));
            if (file.includes("%")) file = file.split("%")[0];
            console.log("Filepointer", file);
            
            //visor.mainWindow.webContents.send('embed', `<iframe frameborder="0" src='file:///D:/oneact/inspec/4333-4345.txt'></iframe>`);
            visor.mainWindow.webContents.send('embed', `<iframe frameborder="0" src='${file}'></iframe>`);
        }

    });

    globalShortcut.register(shortcutPopupStr, function()
    {
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

    //send to frontend
    //visor.mainWindow.webContents.send('dbclose', 'closeit');
    storage.saveToDisk();

    // Unregister a shortcut.
    globalShortcut.unregister(shortcutPopupStr);
    // Unregister all shortcuts.
    globalShortcut.unregisterAll();

    visor.mainWindow.removeAllListeners("close");
    visor.mainWindow.destroy();
    visor.mainWindow = null;
    visor = null;
});

ipcMain.on('storage_remove', function(event, arg)
{
    //console.log("Incoming ROBOT msg from render to main: ", arg);
    storage.remove(arg);
});

ipcMain.handle('storage_search', (event, arg) => {

    
    //console.log("Incoming ROBOT msg from render to main: ", arg);
    let results = storage.search(arg);
    return results;
    //visor.mainWindow.webContents.send('searchresults', results);
});

ipcMain.handle('storage_recent', (event, arg) => {

    //console.log("Incoming ROBOT msg from render to main: ", arg);
    let results = storage.recent();
    return results;
    //visor.mainWindow.webContents.send('searchresults', results);
});

ipcMain.on('robot_paste', function(event, arg)
{
    //console.log("Incoming ROBOT msg from render to main: ", arg);
    nutjs.keyboard.type(nutjs.Key.LeftControl, nutjs.Key.V);
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


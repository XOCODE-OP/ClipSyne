
let prevOSProgramInFocus;

// const ffi = require('ffi-napi');
// const user32 = new ffi.Library('user32', {
//     'GetTopWindow': ['long', ['long']],
//     'FindWindowA': ['long', ['string', 'string']],
//     'SetActiveWindow': ['long', ['long']],
//     'SetForegroundWindow': ['bool', ['long']],
//     'BringWindowToTop': ['bool', ['long']],
//     'ShowWindow': ['bool', ['long', 'int']],
//     'SwitchToThisWindow': ['void', ['long', 'bool']],
//     'GetForegroundWindow': ['long', []],
//     'AttachThreadInput': ['bool', ['int', 'long', 'bool']],
//     'GetWindowThreadProcessId': ['int', ['long', 'int']],
//     'SetWindowPos': ['bool', ['long', 'long', 'int', 'int', 'int', 'int', 'uint']],
//     'SetFocus': ['long', ['long']]
// });
// const kernel32 = new ffi.Library('Kernel32.dll', {
//     'GetCurrentThreadId': ['int', []]
// });

//prevOSProgramInFocus = user32.GetForegroundWindow();
// console.log("prevOSProgramInFocus", prevOSProgramInFocus);
// (async () => {
//     const windowRef = await nutjs.getActiveWindow();
//     console.log("windowRef", windowRef);
//     console.log("windowRef title", windowRef.title);
//     //IF TITLE INCLUDES KEEPASS
// })();



//user32.SetForegroundWindow(prevOSProgramInFocus);

//https://github.com/electron/electron/issues/3472
// function returnFocus() {
//     const dummyTransparentWindow = new BrowserWindow({
//       width: 1,
//       height: 1,
//       x: -100,
//       y: -100,
//       transparent: true,
//       frame: false,
//     });
//     dummyTransparentWindow.close();
//   }
//   returnFocus();

// mainWindow.on('hide', () => {
//       returnFocus();
//   })
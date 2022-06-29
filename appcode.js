'use strict';
/* jshint esversion: 11 */
// jshint node: true
// jshint trailingcomma: false
// jshint undef:true
// jshint unused:false
// jshint varstmt:true
// jshint browser: true

const { clipboard, ipcRenderer } = require('electron');
const remote = require('@electron/remote');
//const { BrowserWindow } = require('@electron/remote')

const COLOR_SELECTION = "rgb(29, 25, 34)";
let entry_list;
let searchfield;
let preview_col;
let thisWindow;
let rightMouseDown = false;
let keyCTRL = false;
let keySHIFT = false;
let selectedClip = {};
selectedClip.uiIndex = -1;
selectedClip.dbid = -1;
selectedClip.content = "";

preview_col = document.querySelector(".preview_col");
searchfield = document.querySelector('#searchfield');
entry_list = document.querySelector('#entry_list');

function resetSelection()
{
    selectedClip.uiIndex = -1;
    selectedClip.dbid = -1;
    selectedClip.content = "";
}

ipcRenderer.on('focusmsg', function(event, message)
{
    searchfield = document.querySelector('#searchfield');
    searchfield.value = "";
    searchfield.style.display = 'none';
    refreshView();
    recolorSelection();
    //let p = message;
});

ipcRenderer.on('init', function(event, message)
{
    console.log("init from main");
});

ipcRenderer.on('embed', function(event, message)
{
    ipcRenderer.send('main_console', "embed: "+ message);
    preview_col.innerHTML = message;
});

//how to receive
// ipcRenderer.on('dbclose', function(event, message)
// {
//     storage_saveToDisk();
// });

//document.addEventListener('DOMContentLoaded', function(event)
window.addEventListener('load', function(event)
{
    console.log("WINDOW LOAD");
    thisWindow =  remote.getCurrentWindow();
    // console.log("window", window);
    // console.log("thisWindow", thisWindow);
    searchfield.style.display = 'none';
    refreshView();
    setupKeyboardEvents();
    window.focus();
});

document.addEventListener('blur', function(e)
{
    searchfield.value = "";
    searchfield.style.display = 'none';
    thisWindow.hide();
});

// entry_list.onwheel = function(e)
// {
//     console.log("scroll", e.deltaY);
//     //e.preventDefault();
// };

function getUiEntryItem(_re)
{
    let all = document.getElementsByClassName("entry_item");
    for (let i = 0; i < all.length; i++)
    {
        if (i == _re) return all[i];
    }
}

function setSelecteditemPeruiIndex()
{
    if (selectedClip.uiIndex < 0) return;
    let e = getUiEntryItem(selectedClip.uiIndex);
    selectedClip.dbid = e.dataset.dbid;
    selectedClip.content = e.innerText;

    preview_col.innerText = selectedClip.content;
}

function setupKeyboardEvents()
{
    document.addEventListener('keydown', function(e)
    {
        if (e.key === 'Control')
        {
            keyCTRL = true;    
        }
        if (e.key === 'Shift')
        {
            keySHIFT = true;    
        }
    });
    document.addEventListener('keyup', function(e)
    {
        //focusable.push(searchfield);
        if (e.key === 'Enter')
        {
            if (selectedClip.uiIndex > -1 && selectedClip.dbid > -1 && selectedClip.content.length > 0)
            {
                clipboard.writeText(selectedClip.content);
                thisWindow.blur();
                thisWindow.hide();
                ipcRenderer.send('robot_paste', selectedClip.content);
            }
        }
        else if (e.key === 'Control')
        {
            keyCTRL = false;    
        }
        else if (e.key === 'Shift')
        {
            keySHIFT = false;    
        }
        else if (e.key === 'ArrowRight')
        {
            if (selectedClip.uiIndex > -1)
            {
                let all = document.getElementsByClassName("entry_item");
                for (let i = 0; i < all.length; i++)
                {
                    if (i == selectedClip.uiIndex)
                    {
                        all[i].style.backgroundColor = "black";
                        all[i].style.height = "auto";
                    }
                }
            }
        }
        else if (e.key === 'ArrowUp')
        {
            if (selectedClip.uiIndex == -1) selectedClip.uiIndex = 0;
                else selectedClip.uiIndex--;
            if (selectedClip.uiIndex < 0) selectedClip.uiIndex = 0;

            setSelecteditemPeruiIndex();
            recolorSelection();
        }
        else if (e.key === 'ArrowDown')
        {
            if (selectedClip.uiIndex == -1) selectedClip.uiIndex = 0;
            else
                selectedClip.uiIndex++;

            setSelecteditemPeruiIndex();
            recolorSelection();
        }
        else if (e.key === 'Delete' || e.key === 'Backspace')
        {
            if (searchfield === document.activeElement)
            {
                refreshView(false);
            }
            if (keySHIFT && keyCTRL && selectedClip.uiIndex > -1 && selectedClip.dbid > -1)
            {
                ipcRenderer.send('storage_remove', selectedClip.dbid);
                //storage_removeData(selectedClip.dbid);
                refreshView(false);
            }
        }
        else if (e.key === 'Escape')
        {
            searchfield.value = "";
            searchfield.style.display = 'none';
            thisWindow.hide();
        }
        else
        { 
            let str = "" + e.key;
            if (str.match(/^[A-Za-z0-9_.]$/))
            {
                //this trigger auto when summoning the app via global shortcut
                //because of this we do the timeout
                if (searchfield.style.display == 'none')
                {
                    searchfield.style.display = 'block';
                    searchfield.value = str;
                }
                
                searchfield.focus();
                refreshView();
            }
        }
    });
}

document.addEventListener("keypress", function(e)
{
    console.log(`Key pressed ${e.key} \r\n Key code value: ${e.code}`);
});

document.addEventListener("mouseup", function(e)
{
    if (e.button == 2) {rightMouseDown = false;}
});
document.addEventListener("mousedown", function(e)
{
    if (e.button == 2) {rightMouseDown = true;}
});
document.addEventListener("mousemove", function(e)
{
    if (rightMouseDown)
    {
        let _x = (thisWindow.getPosition()[0] + e.movementX);
        let _y = (thisWindow.getPosition()[1] + e.movementY);
        thisWindow.setPosition(_x, _y, 0);
    }
});

function recolorSelection()
{
    let all = document.getElementsByClassName("entry_item");
    for (let i = 0; i < all.length; i++)
    {
        all[i].style.backgroundColor = "transparent";
        all[i].style.height = "";
        if (i == selectedClip.uiIndex)
        {
            all[i].style.backgroundColor = COLOR_SELECTION;
            //all[i].style.height = "auto";
        }
    }
}

async function refreshView(resetSel = true)
{
    if (resetSel) resetSelection();
    //console.log("refreshview ", new Error().stack);
    let resultsToShow = [];
    let query = searchfield.value;
    if (query.length > 0)
    {
        //ipcRenderer.send('storage_search', selectedClip.dbid);
        let results = await ipcRenderer.invoke('storage_search', query);
        // ipcRenderer.send('main_console', ["results1", results]);
        if (results != null && results.length > 0)
        {
            resultsToShow = results;
        }
    }
    else
    {
        let results = await ipcRenderer.invoke('storage_recent');
        // ipcRenderer.send('main_console', ["results2", results]);
        if (results != null && results.length > 0)
        {
            resultsToShow = results;
        }
    }


    entry_list.innerHTML = '';
    for (let i = 0; i < resultsToShow.length; i++)
    {
        //const _content = contentArray[indexesToShow[i]].replace(/\n/g, ' ');
        const entrydiv = document.createElement('div');
        entrydiv.classList.add("entry_item");
        entrydiv.dataset.dbid = ""+resultsToShow[i].index;
        entrydiv.innerHTML = "";
        entrydiv.innerText = resultsToShow[i].val;//.replace( /[\r\n]+/gm, "" );
        //entrydiv.innerHTML += `<span class='tooltip'>${_content}</span>`;
        if (i == COLOR_SELECTION.uiIndex) entrydiv.style.backgroundColor = COLOR_SELECTION;
        
        entrydiv.addEventListener("click", function(e)
        {
            //clipboard.writeText((await db.clips.get(row.id)).content);
            selectedClip.uiIndex = i;
            setSelecteditemPeruiIndex();
            clipboard.writeText(selectedClip.content);
            ipcRenderer.send('robot_paste', selectedClip.content);
            thisWindow.hide();
        });
        entrydiv.addEventListener("mouseenter", function(e)
        {
            //console.log("mouseenter ", row.id);
            //this.style.backgroundColor = "rgb(29, 25, 34)";
            selectedClip.uiIndex = i;
            setSelecteditemPeruiIndex();
            recolorSelection();
        });
        entrydiv.addEventListener("mouseleave", function(e)
        {
            //console.log("entry", row.id);
            //this.style.backgroundColor = "transparent";
            //recolorSelection();
        });
        entry_list.appendChild(entrydiv);
    }
    setSelecteditemPeruiIndex();
    recolorSelection();

}

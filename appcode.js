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

const fs = require('fs');
const COLOR_SELECTION = "rgb(29, 25, 34)";
const MAX_RESULTS = 30;
let contentArray;
let filename = "./db_01.json";
let searchfield;
let thisWindow;
let rightMouseDown = false;
let keyCTRL = false;
let keySHIFT = false;
let selectedClip = {};
selectedClip.uiIndex = -1;
selectedClip.dbid = -1;
selectedClip.content = "";

function initData(_filename) //loads if exists
{
    contentArray = [];
    filename = _filename;
    if (fs.existsSync( filename ))
    {
        try {
            contentArray = JSON.parse( fs.readFileSync(filename, "utf8") );
        } catch (error) {
            contentArray = [];
            console.log(`COULD NOT LOAD ${filename}`);
        }
    }
}

function saveToDisk()
{
    fs.writeFile(filename, JSON.stringify(contentArray), function(){});   
}

function removeData(index)
{
    contentArray.splice(index, 1);
    saveToDisk();
}

function addData(content)
{
    let match = false;
    for (let i = 0; i < contentArray.length; i++)
    {
        if (contentArray[i] == content) match = true;
    }
    
    if (!match)
    {
        contentArray.unshift(content);
        saveToDisk();
    }
}

function searchData(term)
{
    console.log("SEARCH DATA:", term);
    let results = []; //array of indexes

    for (let i = 0; i < contentArray.length; i++)
    {
        const e = contentArray[i];
        if (e.includes(term))
        {
            console.log("search:", e, "DOES INCLUDE", term);
            results.push(i);
        }
        else
        {
            console.log("search:", e, "-no include-", term);
        }
        if (results.length >= MAX_RESULTS) return results;
    }

    if (results.length < 1)
    {
        let termSmall = term.toLowerCase();
        for (let i = 0; i < contentArray.length; i++)
        {
            const e = contentArray[i];
            if (e.toLowerCase().includes(termSmall)) results.push(i);
            if (results.length >= MAX_RESULTS) return results;
        }
    }

    if (results.length > 0) return results;
    else return null;

    // for (let [key, value] of map.entries()) {
    //     //console.log(key + " = " + value)
    // }
}



function resetSelection()
{
    selectedClip.uiIndex = -1;
    selectedClip.dbid = -1;
    selectedClip.content = "";
}

/* CHECK IF ALWAYS COPY TO DATASTORE
does not init before first window popup
*/

let prevClipText = clipboard.readText();
function init()
{
    console.log("INIT");
    prevClipText = clipboard.readText();
    setInterval(async function() // STORE AUTOMATICALLY
    {
        ipcRenderer.send('main_console', Date.now()/1000 + "\tstore");
        if (prevClipText !== clipboard.readText())
        {
            prevClipText = clipboard.readText();

            let lastInsert = contentArray[0];
            if (lastInsert != prevClipText)
            {
                addData(prevClipText);
                //refreshView();
            }
        }
    }, 100);
    initData(filename);
    thisWindow =  remote.getCurrentWindow();
    searchfield = document.querySelector('#searchfield');
}
init();



ipcRenderer.on('focusmsg', function(event, message)
{
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

ipcRenderer.on('dbclose', function(event, message)
{
    saveToDisk();
});

//document.addEventListener('DOMContentLoaded', function(event)
window.addEventListener('load', function(event)
{
    console.log("WINDOW LOAD");
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
    let e = getUiEntryItem(selectedClip.uiIndex);
    selectedClip.dbid = e.dataset.dbid;
    selectedClip.content = e.innerText;
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
                ipcRenderer.send('robot_paste', selectedClip.content);
                thisWindow.hide();
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
                removeData(selectedClip.dbid);
                refreshView(false);
                setSelecteditemPeruiIndex();
                recolorSelection();
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

function refreshView(resetSel = true)
{
    if (resetSel) resetSelection();
    //console.log("refreshview ", new Error().stack);
    let indexesToShow = [];
    let query = searchfield.value;
    if (query.length > 0)
    {
        let results = searchData(query);
        if (results != null && results.length > 0)
        {
            indexesToShow = results;
        }
    }
    else
    {
        //recent data
        let lastIndex = Math.min(MAX_RESULTS, contentArray.length-1);
        for (let i = 0; i < lastIndex; i++)
        {
            indexesToShow.push(i);
        }
        // query = `SELECT * FROM clips ORDER BY id DESC LIMIT ?`;
        // params = [100];
    }

    let entry_list = document.querySelector('#entry_list');
    entry_list.innerHTML = '';
    for (let i = 0; i < indexesToShow.length; i++)
    {
        //const _content = contentArray[indexesToShow[i]].replace(/\n/g, ' ');
        const _content = contentArray[indexesToShow[i]];
        const entrydiv = document.createElement('div');
        entrydiv.classList.add("entry_item");
        entrydiv.dataset.dbid = ""+indexesToShow[i];
        entrydiv.innerHTML = "";
        entrydiv.innerText = _content;
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

}

'use strict';
'esversion: 8';
// jshint esversion: 8
// jshint node: true
// jshint trailingcomma: false
// jshint undef:true
// jshint unused:true
// jshint varstmt:true
// jshint browser: true

const { clipboard, remote, ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const dblite = new sqlite3.Database('./clipsdatabase.s3db');
const COLOR_SELECTION = "rgb(29, 25, 34)";

let searchfield;
let thisWindow;
let rightMouseDown = false;
let entry_list;
let keyCTRL = false;
let keySHIFT = false;
let selectedClip = {};
selectedClip.uiid = -1;
selectedClip.dbid = -1;
selectedClip.content = "";

function resetSelection()
{
    selectedClip.uiid = -1;
    selectedClip.dbid = -1;
    selectedClip.content = "";
}


ipcRenderer.on('focusmsg', function(event, message)
{
    searchfield.value = "";
    searchfield.style.display = 'none';
    refreshView();
    recolorSelection();
    //let p = message;
});

ipcRenderer.on('dbclose', function(event, message)
{
    dblite.close();
});

document.addEventListener('DOMContentLoaded', function(event)
{
    thisWindow =  remote.getCurrentWindow();
    searchfield = document.querySelector('#searchfield');
    searchfield.style.display = 'none';
    entry_list = document.querySelector('#entry_list');

    //console.log(remote.app.getPath('userData'));

    setTimeout(async function()
    {
        refreshView();

        let prevClipText = clipboard.readText();

        setInterval(async function() // STORE AUTOMATICALLY
        {
            if (prevClipText !== clipboard.readText())
            {
                prevClipText = clipboard.readText();

                //finding the existing one first is going to be slow when things get big
                let _query = `SELECT * FROM clips WHERE content = ?`;
                dblite.all(_query, [prevClipText], function(err, rows)
                {
                    if (err) throw err;
                    if (!rows || rows.length == 0)
                    {
                        let myquery = `INSERT INTO clips(id, content) VALUES(NULL, ?)`;
                        dblite.run(myquery, [prevClipText], function(err)
                        {
                            if (err) return console.log(err.message);
                            refreshView();                            
                        });
                    }
                });
            }
        }, 400);
    });
    
    setTimeout(function()
    {
        setupKeyboardEvents();
        window.focus();
    }, 300);
    window.focus();
});



document.addEventListener('blur', function(e)
{
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

function setSelecteditemPerUIID()
{
    let e = getUiEntryItem(selectedClip.uiid);
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
            if (selectedClip.uiid > -1 && selectedClip.dbid > -1 && selectedClip.content.length > 0)
            {
                clipboard.writeText(selectedClip.content);
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
            if (selectedClip.uiid > -1)
            {
                let all = document.getElementsByClassName("entry_item");
                for (let i = 0; i < all.length; i++)
                {
                    if (i == selectedClip.uiid)
                    {
                        all[i].style.backgroundColor = "black";
                        all[i].style.height = "auto";
                    }
                }
            }
        }
        else if (e.key === 'ArrowUp')
        {
            if (selectedClip.uiid == -1) selectedClip.uiid = 0;
                else selectedClip.uiid--;
            if (selectedClip.uiid < 0) selectedClip.uiid = 0;

            setSelecteditemPerUIID();
            recolorSelection();
        }
        else if (e.key === 'ArrowDown')
        {
            if (selectedClip.uiid == -1) selectedClip.uiid = 0;
            else
                selectedClip.uiid++;

            setSelecteditemPerUIID();
            recolorSelection();
        }
        else if (e.key === 'Delete' || e.key === 'Backspace')
        {
            if (keySHIFT && keyCTRL && selectedClip.uiid > -1 && selectedClip.dbid > -1)
            {
                let _query = `DELETE FROM clips WHERE id = ?`;
                dblite.run(_query, [selectedClip.dbid], function(err)
                {
                    if (err) return console.log(err.message);

                    refreshView();
                });
            }
            if (searchfield === document.activeElement)
            {
                refreshView();
            }
        }
        else if (e.key === 'Escape')
        {
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
        if (i == selectedClip.uiid)
        {
            all[i].style.backgroundColor = COLOR_SELECTION;
            //all[i].style.height = "auto";
        }
    }
}

function refreshView()
{
    resetSelection();
    //console.log("refreshview ", new Error().stack);
    let query, params;

    if (searchfield.value.length > 0)
    {
        query = `SELECT * FROM clips WHERE content LIKE ? ORDER BY id DESC`;
        params = ['%' + searchfield.value.toLowerCase() + '%'];
    }
    else
    {
        query = `SELECT * FROM clips ORDER BY id DESC LIMIT ?`;
        params = [100];
    }

    dblite.all(query, params, function(err, rows)
    {
        if (err) throw err;

        entry_list.innerHTML = '';
        for (let i = 0; i < rows.length; i++)
        {
            const row = rows[i];
            const _content = row.content.replace(/\n/g, ' ');
            const entrydiv = document.createElement('div');
            entrydiv.classList.add("entry_item");
            entrydiv.dataset.dbid = ""+row.id;
            entrydiv.innerHTML = "";
            entrydiv.innerText = _content;
            entrydiv.innerHTML += `<span class='tooltip'>${_content}</span>`;
            if (i == COLOR_SELECTION.uiid) entrydiv.style.backgroundColor = COLOR_SELECTION;
            
            entrydiv.addEventListener("click", function(e)
            {
                //clipboard.writeText((await db.clips.get(row.id)).content);
                selectedClip.uiid = i;
                setSelecteditemPerUIID();
                clipboard.writeText(selectedClip.content);
                thisWindow.hide();
            });
            entrydiv.addEventListener("mouseenter", function(e)
            {
                //console.log("mouseenter ", row.id);
                //this.style.backgroundColor = "rgb(29, 25, 34)";
                selectedClip.uiid = i;
                setSelecteditemPerUIID();
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
    });

}






function examples()
{

    function ipcTest()
    {
        ipcRenderer.on('asynchronous-reply', function(event, arg)
        {
            console.log("Incoming async msg from MAIN to render: ", arg);
        });
        let ipcResponse = ipcRenderer.sendSync('synchronous-message', 'this is a sync msg from the render');
        console.log(ipcResponse);
        ipcResponse = ipcRenderer.send('asynchronous-message', 'async msg from render');
        console.log(ipcResponse);
    }

    function addClip(_content)
    {
        let _query = `INSERT INTO clips(id, content) VALUES(NULL, ?)`;
        dblite.run(_query, [_content], function(err)
        {
            if (err) return console.log(err.message);
            console.log(`A row has been inserted with row id ${this.lastID}`);
        });
    }

    function findClips(_search)
    {
        let _query = `SELECT * FROM clips WHERE content LIKE ?`;
        dblite.each(_query, ['%' + _search + '%'], function(err, row)
        {
            if (err) throw err;
            console.log(`FIND CLIPS: ${row.id} ${row.content}`);
        });
    }

    function getClip(_id)
    {
        let _query = `SELECT * FROM clips WHERE id = ?`;
        dblite.each(_query, [_id], function(err, row)
        {
            if (err) throw err;
            console.log(`GET CLIP: ${row.id} ${row.content}`);
        });
    }

    function getAllClips(_limit)
    {
        let _query = `SELECT * FROM clips LIMIT ?`;
        dblite.each(_query, [_limit], function(err, row)
        {
            if (err) throw err;
            console.log(`ALL: ${row.id} ${row.content}`);
        });
    }

    function clipExists(_content)
    {
        let _query = `SELECT * FROM clips WHERE content = ?`;
        dblite.all(_query, [_content], function(err, rows)
        {
            if (err) throw err;
            console.log(`FOUND: ${rows.length}`);
        });
    }

}
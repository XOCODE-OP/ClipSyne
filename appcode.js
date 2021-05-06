'use strict';
'esversion: 8';
// jshint node: true
// jshint trailingcomma: false
// jshint undef:true
// jshint unused:true
// jshint varstmt:true
// jshint browser: true

const { clipboard, remote } = require('electron');
//const jquery = require('jquery');
const dexie = require('dexie'); //https://dexie.org/docs/ExportImport/dexie-export-import
dexie.debug = true;
const db = new dexie("clipsdb");

let searchfield;
let thisWindow;
let rightMouseDown = false;
let entry_list;

let keyCTRL = false;
let keySHIFT = false;

let highlighted_id = -1;

let selectColor = "rgb(29, 25, 34)";

document.addEventListener('DOMContentLoaded', function(event)
{
    thisWindow =  remote.getCurrentWindow();
    searchfield = document.querySelector('#searchfield');
    searchfield.style.display = 'none';

    entry_list = document.querySelector('#entry_list');

    // searchfield.addEventListener('change', function(event)
    // {
    //     //event.target.value
    //     refreshView();
    // });

    searchfield.addEventListener('keyup', function(event)
    {
        //event.target.value
        refreshView();
    });

    console.log(remote.app.getPath('userData'));
    
    setTimeout(function()
    {
        setupKeyboardEvents();
        window.focus();
    }, 300);
    window.focus();
});

document.addEventListener('focus', function(e)
{
    console.log("FOCUS INSIDE");
    alert("focus inside");
    refreshView();
});

document.addEventListener('blur', function(e)
{
    thisWindow.hide();
});

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
            
        }
        else if (e.key === 'Control')
        {
            keyCTRL = false;    
        }
        else if (e.key === 'Shift')
        {
            keySHIFT = false;    
        }
        else if (e.key === 'ArrowUp')
        {
            highlighted_id++;
            //if (highlighted_id > )
            // refreshView();
            recolorSelection();
            console.log("ArrowUp", highlighted_id);
        }
        else if (e.key === 'ArrowDown')
        {
            highlighted_id--;
            if (highlighted_id < 0) highlighted_id = 0;
            // refreshView();
            recolorSelection();
            console.log("ArrowDown", highlighted_id);
        }
        else if (e.key === 'Delete' || e.key === 'Backspace')
        {
            if (keySHIFT && keyCTRL && highlighted_id > -1)
            {
                db.clips.delete(highlighted_id);
                // console.log("killed", highlighted_id);
                highlighted_id = -1;
                refreshView();
                recolorSelection();
            }
        }
        else if (e.key === 'Escape')
        {
            thisWindow.hide();
        }
        else if (e.key === 'k')
        {
            //delete
        }
        else
        { 
            //this trigger auto when summoning the app via global shortcut
            //because of this we do the timeout
            searchfield.style.display = 'block';
            searchfield.focus();
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

// remote.getCurrentWindow().on('show', function() {
//     searchfield.focus();
// });

document.body.addEventListener('keydown', function(e)
{
    // let focusable = Array.from(document.querySelectorAll("tr td:first-child"));
    // let index = focusable.indexOf(document.activeElement);

    //focusable.push(searchfield);

    if (e.key === 'ArrowDown') {
        // let nextElement = focusable[index + 1] || focusable[0];
        // nextElement.focus();
    } else if (e.key === 'ArrowUp') {
        // let nextElement = focusable[index - 1] || focusable[focusable.length - 1];
        // nextElement.focus();
    } else if (e.key === 'Enter') {
        // changeToSelected(e)
    } else if (e.key === 'Escape') {
        // searchfield.value = '';
        // refreshView();
        // remote.getCurrentWindow().close();
    } else {
        // searchfield.focus();
        // refreshView();
    }
});



/*
table.addEventListener('click', changeToSelected);

async function changeToSelected(e) {
    if (e.target.id) {
        if (clipboard.readText() === (await db.clips.get(parseInt(e.target.id))).content) {
            return;
        }

        if (e.target.tagName === 'TD') {
            clipboard.writeText((await db.clips.get(parseInt(e.target.id))).content);
        } else if (e.target.id && e.target.tagName === 'BUTTON') {

        }

        await db.clips.delete(parseInt(e.target.id));
        refreshView();
    }
}

*/

function recolorSelection()
{
    let all = document.getElementsByClassName("entry_item");
    console.log(all);
    for (let i = 0; i < all.length; i++)
    {
        all[i].style.backgroundColor = "transparent";
        if (parseInt(all[i].id) == highlighted_id) all[i].style.backgroundColor = selectColor;
    }
}

function refreshView()
{

    //return db.clips.limit(10)...
    db.clips.limit(20).desc()
    .filter(function(clips)
    {
        return !searchfield.value || clips.content.toLowerCase().indexOf(searchfield.value.toLowerCase()) !== -1;
    }).toArray()
    .then(function(clips)
    {
        entry_list.innerHTML = '';
        clips.forEach(function(row)
        {
            const entrydiv = document.createElement('div');
            entrydiv.classList.add("entry_item");
            entrydiv.id = ""+row.id;
            entrydiv.innerHTML = "";
            entrydiv.innerText = "(" + row.id + ") " + row.content.replace(/\n/g, ' ');
            
            entrydiv.addEventListener("click", function(e)
            {
                //clipboard.writeText((await db.clips.get(row.id)).content);
                clipboard.writeText(row.content);
                thisWindow.close();
            });
            entrydiv.addEventListener("mouseenter", function(e)
            {
                console.log("mouseenter ", row.id);
                //this.style.backgroundColor = "rgb(29, 25, 34)";
                highlighted_id = row.id;
                recolorSelection();
            });
            entrydiv.addEventListener("mouseleave", function(e)
            {
                //console.log("entry", row.id);
                //this.style.backgroundColor = "transparent";
                recolorSelection();
            });
            entry_list.appendChild(entrydiv);
        });
    });
}

/* .entry_item:hover
{
    background-color: rgb(29, 25, 34);
} */



setTimeout(async function()
{
    await db.version(1).stores({ clips: "++id,content" }); //ini table

    highlighted_id = 250;
    console.log(highlighted_id);

    refreshView();

    let prevClipText = clipboard.readText();

    setInterval(async function()
    {
        if (prevClipText !== clipboard.readText())
        {
            prevClipText = clipboard.readText();
            db.clips.limit(10000).desc()
                .filter(function(clips)
                {
                    return clips.content === prevClipText;
                })
                .toArray()
                .then(function(clips)
                {
                    clips.forEach(function(row) 
                    {
                        db.clips.delete(row.id);
                    });
                });
            db.clips.add({ content: prevClipText }).then(refreshView);
        }
    }, 100);

    
});


// var db = new Dexie("YOUR_DATABASE_NAME");
// db.version(1).stores({
//     TABLENAME: "++id,name,isCloseFriend",
//     ANOTHER_TABLE_NAME: "++id,name,kind"
// });
// db.open();
// db.TABLENAME.add({name: "Ingemar Bergman", isCloseFriend: 0});
// db.ANOTHER_TABLE_NAME.add({name: "Josephina", kind: "dog", fur: "too long right now"});
//let some = (await db.tablename.get(INDEX).fieldname)
const { clipboard, remote } = require('electron');
//const jquery = require('jquery');
const dexie = require('dexie'); //https://dexie.org/docs/ExportImport/dexie-export-import
dexie.debug = true;
const db = new dexie("clipsdb");

var searchfield;
var thisWindow;
var rightMouseDown = false;
var entry_list;

document.addEventListener('DOMContentLoaded', (event) => {
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
});

setTimeout(function()
{
    document.addEventListener('keyup', function(e)
    {
        //focusable.push(searchfield);
    
        if (e.key === 'Enter')
        {
            
        } else if (e.key === 'Escape') {
        //    searchfield.value = ''
            thisWindow.close();
        } else
        { 
            //this trigger auto when summoning the app via global shortcut
            //because of this we do the timeout
            searchfield.style.display = 'block';
            searchfield.focus();
        }
    });
}, 300);

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

document.addEventListener("click", function()
{
    //console.log("ble");
    

    console.log(thisWindow);
    thisWindow.setPosition(thisWindow.x - 10, thisWindow.y, 0);
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
function refreshView()
{
    //return db.clips.limit(10)...
    db.clips.limit(10).desc()
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
            entrydiv.innerText = row.content.replace(/\n/g, ' ');
            entrydiv.addEventListener("click", function()
            {
                //clipboard.writeText((await db.clips.get(row.id)).content);
                clipboard.writeText(row.content);
                thisWindow.close();
            });
            entry_list.appendChild(entrydiv);
        });
    });
}



setTimeout(async function()
{
    await db.version(1).stores({ clips: "++id,content" }); //ini table

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
'use strict';
/* jshint esversion: 11 */
// jshint node: true
// jshint trailingcomma: false
// jshint undef:true
// jshint unused:true
// jshint varstmt:true
// jshint browser: true

const fs = require('fs');

const MAX_RESULTS = 30;
let storageArr;
let filename = "./db_01.json";

module.exports = {
    init,
    saveToDisk,
    remove,
    add,
    search,
    recent,
    raw
};

function init() //loads if exists
{
    console.log(`STORAGE INIT ${filename}`);
    storageArr = [];
    if (fs.existsSync( filename ))
    {
        try {
            const rawfile = fs.readFileSync(filename, "utf8");
            storageArr = JSON.parse( rawfile );
            // console.log(`SUCCESSFUL LOAD ${filename}`, storageArr);
            console.log(`SUCCESSFUL LOAD ${filename}`);
            // console.log(`raw`, rawfile);
        } catch (error) {
            storageArr = [];
            console.log(`COULD NOT LOAD ${filename}`);
        }
    }
}

function saveToDisk()
{
    fs.writeFile(filename, JSON.stringify(storageArr), function(){});   
}

function remove(index)
{
    storageArr.splice(index, 1);
    saveToDisk();
}

function add(content)
{
    if (storageArr.includes(content)) return;

    let match = false;
    for (let i = 0; i < storageArr.length; i++)
    {
        if (storageArr[i] == content) match = true;
    }
    
    if (!match)
    {
        storageArr.unshift(content);
        saveToDisk();
    }
}

function search(term)
{
    let results = []; //array of indexes

    for (let i = 0; i < storageArr.length; i++)
    {
        const e = storageArr[i];
        if (e.includes(term))   results.push({index: i, val: e});
        if (results.length >= MAX_RESULTS) return results;
    }

    if (results.length < 1)
    {
        let termSmall = term.toLowerCase();
        for (let i = 0; i < storageArr.length; i++)
        {
            const e = storageArr[i];
            if (e.toLowerCase().includes(termSmall)) results.push({index: i, val: e});
            if (results.length >= MAX_RESULTS) return results;
        }
    }

    if (results.length > 0) return results;
    else return null;

    // for (let [key, value] of map.entries()) {
    //     //console.log(key + " = " + value)
    // }
}

function recent()
{
    let results = []; //array of indexes

    for (let i = 0; i < Math.min(MAX_RESULTS, storageArr.length-1); i++)
    {
        results.push({index: i, val: storageArr[i]});
        if (results.length >= MAX_RESULTS) return results;
    }

    if (results.length > 0) return results;
    else return null;
}

function raw(index)
{
    return storageArr[index];
}
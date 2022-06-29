'use strict';
/* jshint esversion: 11 */
// jshint node: true
// jshint trailingcomma: false
// jshint undef:true
// jshint unused:true
// jshint varstmt:true
// jshint browser: true

const fs = require('fs');
const CryptoJS = require("crypto-js");
const { DefaultDeserializer } = require('v8');
const MASTERKEY = "dkJK#FJG234f&3^&TFBG25F45g25a$^Lj()#$$&^%3ggNa6(PMC#(#*NC&$R33563&%MXGCJXNGI";

const MAX_RESULTS = 30;
let storageArr;
let filename = "./db_01.json";
let encryptionEnabled = false;

module.exports = {
    init,
    saveToDisk,
    remove,
    add,
    search,
    recent,
    raw
};

function init(_encryptionEnabled = false) //loads if exists
{
    encryptionEnabled = _encryptionEnabled;
    console.log(`STORAGE INIT ${filename}`);
    storageArr = [];
    if (fs.existsSync( filename ))
    {
        try {
            console.time("load");
            if (encryptionEnabled)
            asdasdasdasdasdas
            DefaultDeserializerasd
            asdasdasdasdasdasdasd
            asd
            console.log("STUB: DOWNLOAD FROM CLOUD");
            console.log("COMPARE FILES, SYNC");
            const rawfile = fs.readFileSync(filename, "utf8");
            const decrypted = decrypt(rawfile);
            storageArr = JSON.parse( decrypted );
            // console.log(`SUCCESSFUL LOAD ${filename}`, storageArr);
            console.log(`SUCCESSFUL LOAD ${filename}`);
            console.timeEnd("load");
            // console.log(`raw`, rawfile);
        } catch (error) {
            storageArr = ["Clipboard is empty"];
            console.log(`COULD NOT LOAD ${filename}`);
        }
    }
}

function saveToDisk()
{
    console.time("save");
    const rawString = JSON.stringify(storageArr);
    const encryptedString = encrypt(rawString);
    fs.writeFile(filename, encryptedString, function(){});   
    fs.writeFile("clear.json", rawString, function(){});   
    console.log("STUB: PUSH TO CLOUD");
    console.timeEnd("save");
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

function encrypt(message, crkey = MASTERKEY)
{
    //console.log("Encrypting Message: " + message + " with key " + crkey);
    return CryptoJS.AES.encrypt(message, crkey).toString();
}

function decrypt(ciphertext, crkey = MASTERKEY)
{
    let bytes  = CryptoJS.AES.decrypt(ciphertext, crkey);
    let plaintext = bytes.toString(CryptoJS.enc.Utf8);
    //console.log("Decrypting " + ciphertext + " with key " + crkey + " to: " + plaintext);
    return plaintext;
}
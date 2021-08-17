/* 
 * (C) 2015 TekMonks. All rights reserved.
 */
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const API_CONSTANTS = require(`${__dirname}/lib/constants.js`);
const readdirAsync = promisify(require("fs").readdir);
const readFileAsync = promisify(require("fs").readFile);
const fsAccessAsync = promisify(require("fs").access);
const statAsync = promisify(require("fs").stat);

exports.doService = async jsonReq => {
    if (!validateRequest(jsonReq)) { LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT; }

    let cmsPath = path.resolve(`${API_CONSTANTS.CMS_ROOT}/${jsonReq.q}`);
    LOG.debug(`Got menu listing request for path: ${cmsPath}`);

    let menu = {};

    try {
        let items = await readdirMenuOrderFileAsyncReturnDir(cmsPath, jsonReq.lang);
        if(typeof (items[0]) == "object") menu.level1 = items;
        else {
            menu.level1 = [];
            for (const entry of items) {
            if (entry.startsWith('.')) continue;    // hidden

                let menu_entry = { item: entry, id: `${encodeURI(cmsPath + "/" + entry)}` };
                let sub_entries = await readdirAsyncReturnOnlyDirs(`${cmsPath}/${entry}`, cmsPath);
                if (sub_entries.length > 0) {
                    menu_entry.hasLevelTwo = true; menu_entry.level2 = []
                    for (let sub_entry of sub_entries) {
                        const sub_menu = { item: sub_entry, id: `${encodeURI(cmsPath + "/" + entry + "/" + sub_entry)}` };
                        try {
                            const fileToRead = `${cmsPath}/${entry}/${sub_entry}/${getEntryi18nName(sub_entry, jsonReq.lang)}`;
                            sub_menu.description = await readFileAsync(fileToRead, "utf8");
                        }
                        catch (err) { sub_menu.description = sub_entry };
                        menu_entry.level2.push(sub_menu);
                    }
                };
                menu.level1.push(menu_entry);
            }
        }
        return { result: true, menu };
    }
    catch (err) {return CONSTANTS.FALSE_RESULT;}
}

function getEntryi18nName(entry, lang) {
    let i18nName = entry.indexOf('.') != -1 ?
        entry.substring(0, entry.lastIndexOf(".") + 1) + lang + ".menu" + entry.substring(entry.lastIndexOf(".")) :
        `${entry}.en.menu.md`;
    return i18nName;
}

async function readdirMenuOrderFileAsyncReturnDir(path, lang, files) {
    var files = [];
    let menuOrderFile = `${path}/menuorder.json`;
    try {
        await fsAccessAsync(menuOrderFile);
        let menuOrderFileContent = JSON.parse(await readFileAsync(menuOrderFile, "utf8"));
        for (const itemContent of Object.values(menuOrderFileContent["menuorder"])){
            itemContent.level1.id = `${encodeURI(path + "/" + itemContent.level1.item)}`
            for (const subItemContent of itemContent.level1.level2) {
                subItemContent.id = `${encodeURI(path + "/" + itemContent.level1.item + "/" + subItemContent.item)}`;
                const fileToRead = `${path}/${itemContent.level1.item}/${subItemContent.item}/${getEntryi18nName(subItemContent.item, lang)}`;
                subItemContent.description = await readFileAsync(fileToRead, "utf8");
            }
            files.push(itemContent.level1);
        }
    } catch (error) {
    }
    return files;
}

async function readdirAsyncReturnOnlyDirs(path) {
    const files = await readdirAsync(path); let filesFiltered = [];
    for (const file of files) if ((await statAsync(`${path}/${file}`)).isDirectory()) filesFiltered.push(file);
    return filesFiltered;
}

const validateRequest = jsonReq => (jsonReq && jsonReq.q && jsonReq.lang);
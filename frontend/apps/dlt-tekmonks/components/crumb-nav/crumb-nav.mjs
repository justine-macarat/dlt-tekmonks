/* 
 * (C) 2019 TekMonks. All rights reserved.
 * License: MIT - see enclosed license.txt file.
 */
import {i18n} from "/framework/js/i18n.mjs";
import {util} from "/framework/js/util.mjs";
import {router} from "/framework/js/router.mjs";
import {session} from "/framework/js/session.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";

async function elementConnected(element) {
	let crumbs = []; let filterDottedDirs = util.parseBoolean(element.getAttribute("filterDottedDirs"));
	let level = element.getAttribute("level"), lang = session.get($$.MONKSHU_CONSTANTS.LANG_ID);
	try {
		let menuResult = await(await fetch(`${APP_CONSTANTS.API_NAV_MENU_LISTING}?q=${level}&lang=${lang}`)).json();
		if (menuResult.result) for (let crumb of menuResult.menu.level1) 
			if ((filterDottedDirs && crumb.item.indexOf(".") == -1) || !filterDottedDirs) crumbs.push(crumb);
		for (let crumb of crumbs) crumb.link = router.encodeURL(util.replaceURLParamValue(
			session.get($$.MONKSHU_CONSTANTS.PAGE_URL), element.getAttribute("level_name"), `${level}/${crumb.item}`));
	} catch (err) {}
	let newCrumbs = [{"item":await i18n.get("back", session.get($$.MONKSHU_CONSTANTS.LANG_ID)),"id":"back_crumb", "link":"javascript:history.back()"}];
	newCrumbs.push(...crumbs); crumbs = newCrumbs;

	crumbs = element.getAttribute("massage_menu") && (element.getAttribute("massage_menu").toLowerCase() == "false") 
		? crumbs : await massageMenu(crumbs);

	let data = {crumbs};

	if (element.getAttribute("styleBody")) data.styleBody = `<style>${element.getAttribute("styleBody")}</style>`;
	
	if (element.id) {
		if (!crumb_nav.datas) crumb_nav.datas = {}; crumb_nav.datas[element.id] = data;
	} else crumb_nav.data = data;
}

async function massageMenu(entries) {
	let i18nObj = await i18n.getI18NObject(session.get($$.MONKSHU_CONSTANTS.LANG_ID));

	for (let entry of entries) {
		// translate the menu item entry or otherwise upcase it properly etc.
		if (i18nObj[entry.item]) entry.item = i18nObj[entry.item]; else {
			if (entry.item.length) entry.item = entry.item.substring(0, 1).toUpperCase() + entry.item.substring(1);
			if (entry.item.indexOf('.') != -1) entry.item = entry.item.substring(0, entry.item.indexOf('.'));
		}
	}

	return entries;
}


function register() {
	// convert this all into a WebComponent so we can use it
	monkshu_component.register("crumb-nav", `${APP_CONSTANTS.APP_PATH}/components/crumb-nav/crumb-nav.html`, crumb_nav);
}

const trueWebComponentMode = true;	// making this false renders the component without using Shadow DOM

export const crumb_nav = {trueWebComponentMode, register, elementConnected}
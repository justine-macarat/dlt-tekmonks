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
	let styleBody; if (element.getAttribute("styleBody")) styleBody = `<style>${element.getAttribute("styleBody")}</style>`;
	let width = 100/element.getAttribute("tiles_per_row"); let styleCellWidth = `<style>.cell{width: ${width}%;}</style>`;

	let data = await createPageData(element); data.styleBody = styleBody; data.styleCellWidth = styleCellWidth;

	if (element.id) {
		if (!content_gallery.datas) content_gallery.datas = {}; content_gallery.datas[element.id] = data;
	} else content_gallery.data = data;
}

async function createPageData(element) {
	const curPath = element.getAttribute("path");
	const subBlogPaths = await(await fetch(`${APP_CONSTANTS.API_CMS_DIR_CONTENTS}?q=${curPath}`)).json();
	if (!subBlogPaths.result) return {}; 
	
	let pageData = {};
	const {content_post} = await import(`${APP_CONSTANTS.APP_PATH}/components/content-post/content-post.mjs`);
	for (const file of subBlogPaths.files) if (/main\..+/.test(file)) 
		pageData.main = { content: await content_post.getArticle(`${curPath}/${file}`), link: router.encodeURL(
			`./article.html?article_path=${curPath}/${file}`) };

	const subBlogRoots = subBlogPaths.files.filter(file => file.indexOf(".") == -1);

	pageData.subcontent = []; 
	if (subBlogRoots.length == 0) {	// no more subblogs, use current depth's articles as tiles
		const entryName = curPath.indexOf("/") != -1 ? curPath.substring(curPath.lastIndexOf("/")+1) : curPath;
		pageData.subcontent.push({
			heading: {content: await getMassagedEntryName(entryName), link: router.encodeURL(session.get($$.MONKSHU_CONSTANTS.PAGE_URL))},
			rows: await getSubBlogs(curPath, element.getAttribute("tiles_per_row"))
		});

	} else for (const subBlogRoot of subBlogRoots) pageData.subcontent.push({ // get tiles for subblogs
		heading: {content: await getMassagedEntryName(subBlogRoot), link: router.encodeURL(util.replaceURLParamValue(
			session.get($$.MONKSHU_CONSTANTS.PAGE_URL), element.getAttribute("path_name"), `${curPath}/${subBlogRoot}`))},
		rows: [(await getSubBlogs(`${element.getAttribute("path")}/${subBlogRoot}`, element.getAttribute("tiles_per_row")))[0]]
	});

	return pageData;
}

async function getSubBlogs(path, number) {
	const subBlogPaths = await(await fetch(`${APP_CONSTANTS.API_CMS_DIR_CONTENTS}?q=${path}`)).json();
	if (!subBlogPaths.result) return []; 
	const subBlogs = subBlogPaths.files.filter(file => file.indexOf(".") != -1);

	let numProcessed = 0; let tiles = []; let rows = [];
	const {content_post} = await import(`${APP_CONSTANTS.APP_PATH}/components/content-post/content-post.mjs`);
	for (const blog of subBlogs) {
		const blogPath = `${path}/${blog}`; 
		tiles.push({content: await content_post.getArticle(blogPath), id: "notblank", 
			link: router.encodeURL(`./article.html?article_path=${blogPath}`)}); 
		numProcessed++; if (numProcessed == number) {rows.push(tiles); tiles = [];}
	}
	// push the last row, if not pushed. push empty tiles for blank spaces, as it helps CSS line up.
	if (tiles.length) {const emptyPushes = number - tiles.length; for (let i = 0; i < emptyPushes; i++) tiles.push({id:"blank"}); rows.push(tiles);}
	return rows;
}

async function getMassagedEntryName(entry) {
	const i18nObj = await i18n.getI18NObject(session.get($$.MONKSHU_CONSTANTS.LANG_ID));

	if (i18nObj[entry]) entry = i18nObj[entry]; else {
		if (entry.length) entry = entry.substring(0, 1).toUpperCase() + entry.substring(1);
		if (entry.indexOf('.') != -1) entry = entry.substring(0, entry.indexOf('.'));
	}

	return entry;
}

function register() {
	// convert this all into a WebComponent so we can use it
	monkshu_component.register("content-gallery", `${APP_CONSTANTS.APP_PATH}/components/content-gallery/content-gallery.html`, content_gallery);
}

const trueWebComponentMode = true;	// making this false renders the component without using Shadow DOM

export const content_gallery = {trueWebComponentMode, register, elementConnected}
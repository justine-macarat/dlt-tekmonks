/* 
 * (C) 2019 TekMonks. All rights reserved.
 * License: MIT - see enclosed license.txt file.
 */
import {monkshu_component} from "/framework/js/monkshu_component.mjs";
import {router} from "/framework/js/router.mjs";
import {session} from "/framework/js/session.mjs";

async function elementConnected(element) {
	const articlePath = element.getAttribute("article"); if (!articlePath) return; 
	
	const article = await getArticle(articlePath);
	let style; if (element.getAttribute("styleContainer")) style = `style="${element.getAttribute("styleContainer")}"`;
	let styleArticle; if (element.getAttribute("styleArticle")) styleArticle = `<style>${element.getAttribute("styleArticle")}</style>`;
	let styleBody; if (element.getAttribute("styleBody")) styleBody = `<style>${element.getAttribute("styleBody")}</style>`;

	if (element.id) {
		if (!content_post.datas) content_post.datas = {}; content_post.datas[element.id] = {article, styleBody, style, styleArticle};
	} else content_post.data = {article, styleBody, style, styleArticle};
}

async function getArticle(path) {
	let articlePath = path + `/${getArticlei18nName(path.substring(path.lastIndexOf("/")+1))}`;
	
	try{
		let article = await(await fetch(`${APP_CONSTANTS.CMS_ROOT_URL}/${articlePath}`)).text();
		return renderArticle(articlePath, article);
	} catch (e) {LOG.error(`Error reading article ${path}: ${e}`); return "";}
}

async function renderArticle(path, text) {
	await $$.require(`${APP_CONSTANTS.APP_PATH}/components/content-post/3p/showdown.min.js`);
	await $$.require(`${APP_CONSTANTS.APP_PATH}/components/content-post/3p/showdown.extension.targetlink.min.js`);
	let article = text;
	if (path == null || path.toLowerCase().endsWith(".md")) article = new showdown.Converter({
		parseImgDimensions: true, simplifiedAutoLink: true, tables: true, simpleLineBreaks: true, emoji: true, 
		underline: true, extensions: ["targetlink"] }).makeHtml(text);

	await $$.require("/framework/3p/mustache.min.js"); 
	Mustache.parse(article); let contentFunctions = getContentFunctions();
	article = Mustache.render(article, contentFunctions);

	return article;
}

function getContentFunctions() {
	return {makeLink: _ => (text, render) => router.encodeURL(render(text))}
}

function getArticlei18nName(article) {
	let i18nName = article.substring(0, article.lastIndexOf(".")+1)+session.get($$.MONKSHU_CONSTANTS.LANG_ID)+article.substring(article.lastIndexOf("."));
	return i18nName;
}


function register() {
	// convert this all into a WebComponent so we can use it
	monkshu_component.register("content-post", `${APP_CONSTANTS.APP_PATH}/components/content-post/content-post.html`, content_post);
}

const trueWebComponentMode = true;	// making this false renders the component without using Shadow DOM

export const content_post = {trueWebComponentMode, register, elementConnected, getArticle, renderArticle}
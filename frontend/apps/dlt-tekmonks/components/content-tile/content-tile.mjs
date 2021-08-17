/* 
 * (C) 2019 TekMonks. All rights reserved.
 * License: MIT - see enclosed license.txt file.
 */
import {util} from "/framework/js/util.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";

async function elementConnected(element) {
	let styleBody; if (element.getAttribute("styleBody")) styleBody = `<style>${element.getAttribute("styleBody")}</style>`;

	if (element.id) {
		if (!content_tile.datas) content_tile.datas = {}; content_tile.datas[element.id] = {styleBody};
	} else content_tile.data = {styleBody};
}

async function elementRendered(element) {
	let contentPath = element.getAttribute("path");
	let result = await(await fetch(`${APP_CONSTANTS.API_CMS_DIR_CONTENTS}?q=${contentPath}&type=text`)).json();
	
	if (!result.result) return; 

	let elementContainer = element.shadowRoot.querySelector("div#container");
	if (element.getAttribute("style")) elementContainer.style.cssText = element.getAttribute("style");

	let articles = result.files; for (const [i,article] of articles.entries()) articles[i] = `${contentPath}/${article}`;

	let tilesPerSlide = element.getAttribute("tiles_per_slide")||4;
	let numSlides = articles.length%tilesPerSlide != 0 ? ~~(articles.length/tilesPerSlide)+1:articles.length/tilesPerSlide;

	styleDots(element, numSlides);

	styleSliderArrows(element, numSlides);

	await setArticles(element, articles, numSlides, tilesPerSlide);

	runAnimation(element, numSlides, element.getAttribute("pause")||5000);
}

function styleDots(element, numImages) {
	if (numImages == 1) {
		element.shadowRoot.querySelector("div#slider .nav-dots").style.visibility = "hidden";
		return;
	}

	if (element.getAttribute("dot_style")) {
		let existingDotStyle = util.getCSSRule(element.shadowRoot, ".nav-dots .nav-dot").style.cssText;
		util.getCSSRule(element.shadowRoot, ".nav-dots .nav-dot").style.cssText = existingDotStyle + element.getAttribute("dot_style");
	}
		
	if (element.getAttribute("selected_dot_style")) {
		let existingDotStyle = util.getCSSRule(element.shadowRoot, ".nav-dots .nav-dot:hover").style.cssText;
		util.getCSSRule(element.shadowRoot, ".nav-dots .nav-dot:hover").style.cssText = existingDotStyle + element.getAttribute("selected_dot_style");
		util.getCSSRule(element.shadowRoot, ".nav-dot-selected").style.cssText = existingDotStyle + element.getAttribute("selected_dot_style") + " !important";
	}
}

async function setArticles(element, articleArray, numSlides, tilesPerSlide) {
    let elementFig = element.shadowRoot.querySelector("div#slider figure");
	elementFig.style.width = `${numSlides*100}%`;
	
	for (let article of articleArray) {
		let elementArticle = document.createElement("article"); 
		const {content_post} = await import(`${APP_CONSTANTS.APP_PATH}/components/content-post/content-post.mjs`);
		elementArticle.innerHTML = await content_post.getArticle(article);

		if (element.getAttribute("article_style")) elementArticle.style = element.getAttribute("article_style");
		let width=`calc(${(100/numSlides)/tilesPerSlide}% - ${elementArticle.style.paddingLeft} - ${elementArticle.style.paddingRight})`;
		elementArticle.style.width = width;
		elementFig.appendChild(elementArticle);
	}

	let elementLi = element.shadowRoot.querySelector("div#slider li");
	for (let i = 0; i < numSlides; i++) {
		let elementLabel = document.createElement("label");
		elementLabel.className = "nav-dot"; elementLabel.id = `dot-${i}`; 
		elementLabel.onclick = _=> {elementFig.style.left = `${-1*i*100}%`; makeNavDotSelected(element, i, numSlides);}
		elementLi.appendChild(elementLabel);
	}

	makeNavDotSelected(element, 0, numSlides);
}

function styleSliderArrows(element, numImages) {
	if (numImages == 1) {
		element.shadowRoot.querySelector(".left-arrow").style.visibility = "hidden";
		element.shadowRoot.querySelector(".right-arrow").style.visibility = "hidden";
		return;
	}

	let elementFig = element.shadowRoot.querySelector("div#slider figure");

	if (element.getAttribute("chevron_style")) {
		let existingChevronStyle = util.getCSSRule(element.shadowRoot, ".left-arrow").style.cssText;
		util.getCSSRule(element.shadowRoot, ".left-arrow").style.cssText = existingChevronStyle + element.getAttribute("chevron_style");

		existingChevronStyle = util.getCSSRule(element.shadowRoot, ".right-arrow").style.cssText;
		util.getCSSRule(element.shadowRoot, ".right-arrow").style.cssText = existingChevronStyle + element.getAttribute("chevron_style");
	}

	let elementLeftArrow = element.shadowRoot.querySelector(".left-arrow");
	elementLeftArrow.onclick = _ => {
		let curPercent = elementFig.style.left ? elementFig.style.left.substring(0, elementFig.style.left.length-1) : 0;
		curPercent = curPercent == 0 ? (numImages-1)*-1*100:parseInt(curPercent)+100;
		elementFig.style.left = `${curPercent}%`;
		
		makeNavDotSelected(element, -1*curPercent/100, numImages);
	}

	let elementRightArrow = element.shadowRoot.querySelector(".right-arrow");
	elementRightArrow.onclick = _ => {
		let curPercent = elementFig.style.left ? elementFig.style.left.substring(0, elementFig.style.left.length-1) : 0;
		curPercent = curPercent-100 == numImages*-1*100 ? 0:curPercent-100;
		elementFig.style.left = `${curPercent}%`;
		
		makeNavDotSelected(element, -1*curPercent/100, numImages);
	}
}

function runAnimation(element, numSlides, pause) {
	let elementFig = element.shadowRoot.querySelector("div#slider figure");
	setInterval(_ => {
		if (!elementFig.style.transition) elementFig.style.transition = `all ${(element.getAttribute("transition")||1000)/1000}s ease-in-out`;
		
		let curPercent = elementFig.style.left ? elementFig.style.left.substring(0, elementFig.style.left.length-1) : 0;
		curPercent = curPercent-100 == numSlides*-1*100 ? 0:curPercent-100;
		elementFig.style.left = `${curPercent}%`;
		
		makeNavDotSelected(element, -1*curPercent/100, numSlides);
	}, pause);
}

function makeNavDotSelected(element, selected, numSlides) {
	for (let i = 0; i < numSlides; i++) {
		let elementNavDot = element.shadowRoot.querySelector(`#dot-${i}`);
		if (i == selected) elementNavDot.classList.add("nav-dot-selected"); 
		else elementNavDot.classList.remove("nav-dot-selected");
	}
}

function register() {
	// convert this all into a WebComponent so we can use it
	monkshu_component.register("content-tile", `${APP_CONSTANTS.APP_PATH}/components/content-tile/content-tile.html`, content_tile);
}

const trueWebComponentMode = true;	// making this false renders the component without using Shadow DOM

export const content_tile = {trueWebComponentMode, register, elementConnected, elementRendered}
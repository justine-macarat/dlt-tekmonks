/* 
 * (C) 2019 TekMonks. All rights reserved.
 * License: MIT - see enclosed license.txt file.
 */
import {util} from "/framework/js/util.mjs";
import {session} from "/framework/js/session.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";

async function elementConnected(element) {
	let styleBody; if (element.getAttribute("styleBody")) styleBody = `<style>${element.getAttribute("styleBody")}</style>`;

	if (element.id) {
		if (!image_slider.datas) image_slider.datas = {}; image_slider.datas[element.id] = {styleBody};
	} else image_slider.data = {styleBody};
}

async function elementRendered(element) {
	let imagesPath = element.getAttribute("path");
	let result = await(await fetch(`${APP_CONSTANTS.API_CMS_DIR_CONTENTS}?q=${imagesPath}`)).json();
	
	if (!result.result) return; 

	let elementContainer = element.shadowRoot.querySelector("div#container");
	if (element.getAttribute("style")) elementContainer.style = element.getAttribute("style");

	let fetchThrowErrors = path => fetch(path).then(response => {if (!response.ok) throw("FetchError"); return response;});
	let images = result.files;
	let imageLoader = async function(image) {
		let caption = null; let isMD = null;
		try {caption = await(await fetchThrowErrors(`${APP_CONSTANTS.CMS_ROOT_URL}/${imagesPath}/${image}/${image}.${session.get($$.MONKSHU_CONSTANTS.LANG_ID)}.md`)).text(); isMD=true;} catch(err) {}
		if (!caption) try {caption = await(await fetchThrowErrors(`${APP_CONSTANTS.CMS_ROOT_URL}/${imagesPath}/${image}/${image}.html`)).text(); isMD=false;} catch(err) {}
		return {img: `${APP_CONSTANTS.CMS_ROOT_URL}/${imagesPath}/${image}/${image}`, caption, isMD}
	}
	for (let [i,image] of images.entries()) images[i] = await imageLoader(image);

	styleDots(element, images.length);

	await setImages(element, images);

	styleSliderArrows(element, images.length);

	runAnimation(element, images.length, element.getAttribute("pause")||5000);
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

async function setImages(element, imgArray) {
	let numImages = imgArray.length;

    let elementFig = element.shadowRoot.querySelector("div#slider figure");
	elementFig.style.width = `${numImages*100}%`;

	let elementLi = element.shadowRoot.querySelector("div#slider li");
	
	const {content_post} = await import(`${APP_CONSTANTS.APP_PATH}/components/content-post/content-post.mjs`);
	for (const [i, image] of imgArray.entries()) {
		let elementDivImgContainer = document.createElement("div"); elementDivImgContainer.className = "relative";
		let elementImg = document.createElement("img");
		elementImg.src = image.img; elementImg.style.width = `${100/numImages}%`; elementImg.style.cssText += element.getAttribute("style");	
		elementDivImgContainer.appendChild(elementImg);
		
		if (image.caption) {
			let elementImgCaption = document.createElement("article"); elementImgCaption.classList.add("caption");
			elementImgCaption.innerHTML = image.isMD ? await content_post.renderArticle(null, image.caption) : image.caption;
			elementImgCaption.style.cssText += element.getAttribute("caption_style") ? element.getAttribute("caption_style") : "";
			elementDivImgContainer.appendChild(elementImgCaption);
		}

		elementFig.appendChild(elementDivImgContainer);

		let elementLabel = document.createElement("label");
		elementLabel.className = "nav-dot"; elementLabel.id = `dot-${i}`; 
		elementLabel.onclick = _=> {elementFig.style.left = `${-1*i*100}%`; makeNavDotSelected(element, i, numImages);}
		elementLi.appendChild(elementLabel);
	}

	makeNavDotSelected(element, 0, numImages);
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

function runAnimation(element, numImages, pause) {
	let elementFig = element.shadowRoot.querySelector("div#slider figure");
	setInterval(_ => {
		if (!elementFig.style.transition) elementFig.style.transition = `all ${(element.getAttribute("transition")||1000)/1000}s ease-in-out`;
		
		let curPercent = elementFig.style.left ? elementFig.style.left.substring(0, elementFig.style.left.length-1) : 0;
		curPercent = curPercent-100 == numImages*-1*100 ? 0:curPercent-100;
		elementFig.style.left = `${curPercent}%`;
		
		makeNavDotSelected(element, -1*curPercent/100, numImages);
	}, pause);
}

function makeNavDotSelected(element, selected, numImages) {
	for (let i = 0; i < numImages; i++) {
		let elementNavDot = element.shadowRoot.querySelector(`#dot-${i}`);
		if (i == selected) elementNavDot.classList.add("nav-dot-selected"); 
		else elementNavDot.classList.remove("nav-dot-selected");
	}
}

function register() {
	// convert this all into a WebComponent so we can use it
	monkshu_component.register("image-slider", `${APP_CONSTANTS.APP_PATH}/components/image-slider/image-slider.html`, image_slider);
}

const trueWebComponentMode = true;	// making this false renders the component without using Shadow DOM

export const image_slider = {trueWebComponentMode, register, setImages, elementConnected, elementRendered}
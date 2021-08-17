/* 
 * (C) 2019 TekMonks. All rights reserved.
 * License: MIT - see enclosed license.txt file.
 */
import {monkshu_component} from "/framework/js/monkshu_component.mjs";

function register() {
	// convert this all into a WebComponent so we can use it
	monkshu_component.register("page-meta", null, page_meta);
}

async function elementRendered(element) {
	const filesToInject = element.getAttribute("files").split(',');

	for (const file of filesToInject) {
		const data = await fetch(file);
		if (data.ok) {
			const content = await data.text();
			document.head.innerHTML += content;
		}
	}
}


const trueWebComponentMode = true;	// We can still reach the head from document

export const page_meta = {trueWebComponentMode, register, elementRendered}
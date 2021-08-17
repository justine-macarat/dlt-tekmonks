/* 
 * (C) 2015 TekMonks. All rights reserved.
 */
const API_CONSTANTS = require(`${__dirname}/lib/constants.js`);
const path = require("path");
const readFileAsyc = require("util").promisify(require("fs").readFile);

exports.doService = async jsonReq => {
	if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}
    
    let cmsPath = path.resolve(`${API_CONSTANTS.CMS_ROOT}/${jsonReq.q}`);
	LOG.debug(`Got fetch article request for path: ${cmsPath}`);

    try { 
        return {result: true, article: jsonReq.type && jsonReq.type.toLowerCase() == "text" ?
            await readFileAsyc(cmsPath, jsonReq.encoding || "utf8") :
            Buffer.from(await readFileAsyc(cmsPath)).toString("base64")};
    } 
    catch (err) {return CONSTANTS.FALSE_RESULT;}
}

const validateRequest = jsonReq => (jsonReq && jsonReq.q);
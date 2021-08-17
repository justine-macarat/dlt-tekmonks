/* 
 * (C) 2015 TekMonks. All rights reserved.
 */
const API_CONSTANTS = require(`${__dirname}/lib/constants.js`);
const path = require("path");
const readdirAsync = require("util").promisify(require("fs").readdir);
const readFileAsyc = require("util").promisify(require("fs").readFile);

exports.doService = async jsonReq => {
	if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}
    
    let cmsPath = path.resolve(`${API_CONSTANTS.CMS_ROOT}/${jsonReq.q}`);
	LOG.debug(`Got dir listing request for path: ${cmsPath}`);

    try { 
        let articles = [];
        (await readdirAsync(cmsPath)).forEach(articleFile => {
            articles.push(jsonReq.type && jsonReq.type.toLowerCase() == "text" ?
                await readFileAsyc(`${cmsPath}/${articleFile}`, jsonReq.encoding || "utf8") :
                Buffer.from(await readFileAsyc(`${cmsPath}/${articleFile}`)).toString("base64"));
        })
        return {result: true, articles}; 
    } 
    catch (err) {return CONSTANTS.FALSE_RESULT;}
}

const validateRequest = jsonReq => (jsonReq && jsonReq.q);
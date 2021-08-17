/* 
 * (C) 2015 TekMonks. All rights reserved.
 */
const API_CONSTANTS = require(`${__dirname}/lib/constants.js`);
const nodemailer = require(`${__dirname}/../3p/node_modules/nodemailer`);

exports.doService = async jsonReq => {
    if (!validateRequest(jsonReq)) { LOG.error("Validation failure."); return jsonReq; }

    try {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'justine.macarat@tekmonks.com',
          pass: 'justineshane'
        }
      });
    
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: jsonReq.email + "<do not reply>", // sender address
        to: "sales@tekmonks.com", // list of receivers
        subject: "Contact Request", // Subject line
        text: "Name: "+jsonReq.name + "   Company Name: "+jsonReq.company + "   Designation: "+jsonReq.designation + "   Service Offered: "+jsonReq.serviceoffered + "    Email: "+jsonReq.email + "   Tel: "+jsonReq.tel + "   Website: "+jsonReq.website+ "   Country: "+jsonReq.country+"  Message: "+jsonReq.message,
        html: "Name: "+jsonReq.name + "<br/>Company Name: "+jsonReq.company + "<br/>Designation: "+jsonReq.designation + "<br/>Service Offered: "+jsonReq.serviceoffered + "<br/>Email: "+jsonReq.email + "<br/>Tel: "+jsonReq.tel + "<br/>Website: "+jsonReq.website + "<br/>Country: "+jsonReq.country + "<br/>Message: "+jsonReq.message
      });
      
      return { result: true };
    }
     catch (err) {return CONSTANTS.FALSE_RESULT;}
}

const validateRequest = jsonReq => (jsonReq && jsonReq.name && jsonReq.company && jsonReq.email && jsonReq.tel && jsonReq.message);
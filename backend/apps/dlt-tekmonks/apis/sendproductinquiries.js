/* 
 * (C) 2015 TekMonks. All rights reserved.
 */
const API_CONSTANTS = require(`${__dirname}/lib/constants.js`);
const nodemailer = require(`${__dirname}/../3p/node_modules/nodemailer`);

exports.doService = async jsonReq => {

    try {
      let contacts_html = "";
      let product_html = "<br/>Product Inquiries for: <br/> <ul>"
      for(const key in jsonReq) {
        if (key == "name" || key == "company" || key == "email" || key == "tel" || key == "website" || key == "message") {
          details = key[0].toUpperCase() + key.slice(1);
          contacts_html += details + ": " + jsonReq[key] + "<br/>";
        }
        else product_html += "<li>" + jsonReq[key] + "</li>";
        product_html += "</u>"
      }

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
        text: contacts_html + product_html,
        html: contacts_html + product_html
      });
      
      return { result: true };
    }
     catch (err) {return CONSTANTS.FALSE_RESULT;}
}
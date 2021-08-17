/**
 * Handles forms
 */
 import { apimanager as apiman } from "/framework/js/apimanager.mjs";
 import {router} from "/framework/js/router.mjs";
 import {monkshu_component} from "/framework/js/monkshu_component.mjs";
 import {session} from "/framework/js/session.mjs";
 
 
 async function submit(form) {
     if (form.name == "" || form.company == "" || form.designation == "" || form.serviceoffered == "" || form.email == "" || form.tel == "" || form.country == "" || form.message == "" ) alert ("Please fill all required fields"); 
     else {
     const contactData = {
             name: form.name,
             company: form.company,
             email: form.email,
             tel: form.tel,
             message: form.message,
         designation: form.designation,
         serviceoffered : form.serviceoffered,
         website : form.website,
         country : form.country
         }
 
     for (var key in contactData) {
         if (contactData[key] === undefined) contactData[key] = "N/A";
         }
 
         const apiResponse = await apiman.rest(APP_CONSTANTS.API_SEND_CONTACTS_EMAIL, "POST", contactData, true, false);
         alert ("Message Request succesfully sent!"); 
         router.reload();
     }    
 
 }
 
 async function submit_product(form) {
     let mainpage = document.querySelector('page-generator');
     let contactform = mainpage.shadowRoot.querySelector('#contactform');
     let productcheckbox = mainpage.shadowRoot.querySelector('#productcheckbox');
 
     let formData = {}; 
 
     for (let id of contactform.webscrolls_env.formGeneratorIDs) {
         let contactFormElement = contactform.shadowRoot.querySelector(`#${id}`);
         if (contactFormElement.name) formData[id] = contactFormElement.value;
     }
 
     for (let id of productcheckbox.webscrolls_env.formGeneratorIDs) {
         let formElement = productcheckbox.shadowRoot.querySelector(`#${id}`);
         if(formElement.checked == true) formData[id] = formElement.value;
     }
     
     if (formData.name == "" || formData.email == "" || formData.tel == "" || formData.website == "" || formData.message == "" ) alert('Please fill in required details');
     else {
 
         for (var key in formData) {
             if (formData[key] === undefined) {
                 formData[key] = "N/A";
             }
         }
 
         console.log(formData);
 
         const apiResponse = await apiman.rest(APP_CONSTANTS.API_SEND_PRODUCT_INQUIRIES, "POST", formData, true, false);
         if(apiResponse) alert ("Message Request succesfully sent!"); 
         else alert ("Server error. Please try again."); 
         router.reload();
    }    
 
 }
 
 export const contactform = {submit, submit_product}
 
const sendgrid = require('@sendgrid/mail');
const ejs = require('ejs');
const path = require('path');
if(NODE_ENV = 'development'){
    require('dotenv').config();
}

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const sendOrderEmail = async (to, subject, dynamicTemplateData) => {
    try {
        await sendgrid.send({
            to,
            from:process.env.FROM_EMAIL,
            templateId:'d-0785fa0bd8da41c98c08a6b80ef4e92e',
            subject,
            dynamicTemplateData
        });

        console.log(`Email sent to ${to}`);
    } catch(error) {
        console.error('Failed to send mail:', error.response.body.errors);
        throw error;
    }
    
}

const notifyAdminByEmail = async(datas) => {
    try{
        await sendgrid.send({
            to:'cy7624868@gmail.com',
            from:process.env.FROM_EMAIL,
            templateId:'d-b40e2210fbe24b29b5bc4b02a9feb7a4',
            dynamicTemplateData:datas
        });
    }catch(error){
        console.log('Failed to send mail to admin', error.response);
        throw error;
    }
}

module.exports = {
    sendOrderEmail,
    notifyAdminByEmail
};
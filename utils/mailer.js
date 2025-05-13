const sendgrid = require('@sendgrid/mail');
const ejs = require('ejs');
const path = require('path');
require('dotenv').config();

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

module.exports = {
    sendOrderEmail
};
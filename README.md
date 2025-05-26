# Order Form System

A comprehensive order form solution that automates order processing, email notifications, and document management using Google services.

## Overview

This project implements an online order form system that:
- Captures customer order details through a web form
- Processes orders server-side with Node.js and Express.js
- Stores order data in Google Sheets for record-keeping
- Creates detailed order documents in Google Docs
- Sends confirmation emails to customers and notifications to administrators
- Implements security measures including Google reCAPTCHA

## Technologies Used

- **Backend**: Node.js with Express.js
- **Frontend**: EJS templates for server-side rendering
- **Email Service**: SendGrid for reliable email delivery
- **Data Storage**: Google Sheets API
- **Document Creation**: Google Docs API
- **File Management**: Google Drive API
- **Security**: Google reCAPTCHA for bot protection

## Features

### Customer Ordering
- User-friendly order form with validation
- Bot protection using Google reCAPTCHA
- Automatic email confirmation upon successful order submission

### Order Processing
- Secure server-side processing of all order data
- Automatic creation of detailed order records in Google Sheets
- Generation of customized order documents in Google Docs

### Notification System
- Customer confirmation emails with order details
- Admin notification emails for new order alerts
- Email templating for consistent communication

### Google Services Integration
- Seamless integration with Google Sheets for data storage
- Automatic document generation in Google Docs
- Organized file management in Google Drive

## Setup for Development

### Prerequisites
- Node.js (v14+ recommended)
- Google Cloud Platform account with API access
- SendGrid account for email services
- Google reCAPTCHA keys

### Environment Variables
Create a `.env` file in the root directory based on the provided `.env.example` with the following variables:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Google API Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your-private-key
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_FOLDER_ID=your-google-drive-folder-id

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=your-sender-email@example.com
ADMIN_EMAIL=admin-notification-email@example.com

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

## How It Works

1. **Customer Submits Order**:
   - Customer fills out the order form on the frontend
   - reCAPTCHA verification is performed to prevent bot submissions

2. **Server Processing**:
   - Express.js backend validates and processes the form data
   - Order details are formatted for storage and notifications

3. **Google Services Integration**:
   - Order data is added to a Google Sheet for record-keeping
   - A new Google Doc is created with complete order details
   - The document is stored in a designated Google Drive folder

4. **Email Notifications**:
   - Customer receives a confirmation email with order summary
   - Admin receives notification of the new order with details

## Project Structure

```
order-form/
├── public/            # Static assets (CSS, JavaScript, images)
├── views/             # EJS templates
├── routes/            # Express routes
├── controllers/       # Request handlers
├── services/          # Business logic (Google API, SendGrid)
├── models/            # Data models
├── utils/             # Helper functions
├── middleware/        # Express middleware
├── config/            # Configuration files
├── .env               # Environment variables (not in repo)
├── .env.example       # Example environment variables
├── app.js             # Application entry point
└── package.json       # Project dependencies
```

## Security Considerations

- All API keys and credentials are stored securely in environment variables
- Google reCAPTCHA protects against bot submissions
- Input validation is performed on all user-submitted data
- HTTPS is enforced for all communications

## Business Use

This project is designed for business applications and is not intended for public installation. It's a custom solution for handling orders with automated document creation and notification systems.

## License

[Specify your license here]
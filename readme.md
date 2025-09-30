# Bidwaza Backend Documentation

## Overview

Bidwaza is an e-commerce backend built with Node.js, Express, and OracleDB. It provides RESTful APIs for user authentication, profile management, product operations, cart management, and email services. Authentication is handled via JWT cookies. All endpoints return JSON responses.

---

## Project Structure

```
backend/
│
├── Controller/         # API logic for authentication, users, sellers, cart
│   ├── auth.Controller.js
│   ├── cart.Controller.js
│   ├── seller.Controller.js
│   └── user.Controller.js
│
├── Db/                 # Database connection logic
│   └── Db.js
│
├── middleware/         # Express middleware (auth, file upload)
│   ├── auth.middleware.js
│   └── multer.middleware.js
│
├── public/             # Static/public files
│   └── temp/
│
├── Routes/             # Route definitions
│   ├── auth.js
│   ├── cart.js
│   ├── seller.js
│   └── user.js
│
├── Service/            # External services (Cloudinary, Email)
│   ├── cloudinary.js
│   └── emailService.js
│
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── index.js            # Entry point
└── package.json        # Dependencies and scripts
```

---

## REST API Endpoints

### Authentication & User APIs

- **POST `/register`**  
  Register a new user.

- **POST `/login`**  
  Login user and set JWT cookie.

- **POST `/logout`**  
  Logout user (clears JWT cookie).

- **POST `/getCurrentUser`**  
  Get current authenticated user info.

- **POST `/sendverificationCode`**  
  Send email verification code.

- **POST `/verifyCode`**  
  Verify email with code.

- **POST `/resendCode`**  
  Resend verification code.

- **POST `/updatePassword`**  
  Change user password.

---

### User Profile APIs

- **POST `/user/uploadprofile`**  
  Upload a new profile picture.  
  *(multipart/form-data, field: `file`)*

- **POST `/user/editprofile`**  
  Edit profile picture.  
  *(multipart/form-data, field: `file`)*

---

### Seller APIs

- **POST `/seller/addProduct`**  
  Add a new product (with images).  
  *(multipart/form-data, fields: `title`, `description`, `category`, `stock`, `product_type`, `amount`, files: `files[]`)*

---

### Cart APIs

- **(Defined in `cart.js` and `cart.Controller.js`)**  
  Endpoints for cart operations (add, remove, update items, etc.).

---

## Error Handling

All endpoints return error responses with:
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Middleware

- **auth.middleware.js**  
  Protects routes, checks JWT authentication.

- **multer.middleware.js**  
  Handles file uploads (images, profile pictures).

---

## Services

- **cloudinary.js**  
  Handles image uploads to Cloudinary.

- **emailService.js**  
  Sends verification and notification emails.

---

## Environment Variables

Configure your `.env` file with:
```
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_CONNECTION_STRING=your_db_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
EMAIL_SERVICE_API_KEY=your_email_api_key
```

---

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```
2. Set up your `.env` file.
3. Start the server:
   ```
   node index.js
   ```
4. Access API endpoints via your preferred HTTP client.

---

## Notes

- All profile and seller endpoints require authentication.
- File uploads use `multipart/form-data`.
- See the `Controller`, `Routes`, and `middleware` folders for implementation details.
- For database setup, refer to `Db/Db.js`.

---
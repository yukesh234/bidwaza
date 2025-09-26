# Bidwaza Backend API Documentation

## Overview

This backend provides RESTful APIs for user authentication, profile management, and seller product operations. All endpoints return JSON responses. Authentication is handled via JWT cookies.

---

## Authentication & User APIs

### `POST /register`
Register a new user.

**Body:**
```json
{
  "firstname": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "interests": ["array of strings"]
}
```
**Response:**
```json
{
  "message": "User registered successfully",
  "user": { ... },
  "success": true
}
```

---

### `POST /login`
Login user and set JWT cookie.

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "success": true
}
```

---

### `POST /logout`
Logout user (clears JWT cookie).

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### `POST /getCurrentUser`
Get current authenticated user info.

**Response:**
```json
{
  "user": { ... }
}
```

---

### `POST /sendverificationCode`
Send email verification code.

**Body:**
```json
{
  "email": "string"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

---

### `POST /verifyCode`
Verify email with code.

**Body:**
```json
{
  "email": "string",
  "code": "string"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### `POST /resendCode`
Resend verification code.

**Body:**
```json
{
  "email": "string"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Verification code resent"
}
```

---

## User Profile APIs

### `POST /user/uploadprofile`
Upload a new profile picture.  
**(multipart/form-data, field: `file`)**

**Response:**
```json
{
  "success": true,
  "url": "https://cloudinary.com/your-image-url"
}
```

---

### `POST /user/editprofile`
Edit profile picture.  
**(multipart/form-data, field: `file`)**

**Response:**
```json
{
  "success": true,
  "url": "https://cloudinary.com/your-image-url"
}
```

---

## Seller APIs

### `POST /seller/addProduct`
Add a new product.  
**(multipart/form-data, fields: `title`, `description`, `category`, `stock`, `product_type`, `amount`, files: `files[]`)**

**Response:**
```json
{
  "success": true,
  "message": "Product added successfully",
  "data": {
    "itemId": 123,
    "title": "...",
    "category": "...",
    "product_type": "...",
    "amount": 100,
    "images": ["https://cloudinary.com/img1", ...]
  }
}
```

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

## Notes

- Authentication is required for profile and seller endpoints.
- File uploads use `multipart/form-data`.
- See the `Controller`, `Routes`, and `middleware` folders for implementation details.

# Bidwaza - Online Auction & E-Commerce Platform

A full-stack web application for conducting online auctions and buying/selling products with real-time bidding, seller dashboard, and integrated payment system.

---

## 🌐 Project Overview

Bidwaza is a comprehensive online auction and e-commerce platform featuring:
- **Real-time Bidding System** with WebSocket support
- **User Authentication** with email verification
- **Seller Dashboard** with analytics and performance metrics
- **Shopping Cart** and product management
- **Integrated Payment Gateway** (eSeWa)
- **Digital Wallet** system
- **Auction History** and bid tracking

---

## 📁 Project Structure

```
bidwaza/
├── backend/                          # Node.js/Express API server
│   ├── Controller/                   # Request handlers
│   │   ├── analytics.js             # Analytics logic
│   │   ├── auction.Controller.js    # Auction bidding
│   │   ├── auth.Controller.js       # Authentication
│   │   ├── cart.Controller.js       # Shopping cart
│   │   ├── esewa.Controller.js      # Payment gateway
│   │   ├── seller.Controller.js     # Seller management
│   │   ├── user.Controller.js       # User management
│   │   └── wallet.Controller.js     # Wallet operations
│   │
│   ├── Routes/                       # API route definitions
│   │   ├── auth.js                  # Authentication endpoints
│   │   ├── auction.js               # Auction endpoints
│   │   ├── cart.js                  # Cart endpoints
│   │   ├── esewa.js                 # Payment endpoints
│   │   ├── seller.js                # Seller endpoints
│   │   ├── user.js                  # User endpoints
│   │   ├── wallet.js                # Wallet endpoints
│   │   └── analytics.js             # Analytics endpoints
│   │
│   ├── Service/                      # External services
│   │   ├── auctionService.js        # Auction business logic
│   │   ├── cloudinary.js            # Image upload service
│   │   ├── emailService.js          # Email notifications
│   │   └── generateEsewaSIgnature.js# Payment signature
│   │
│   ├── middleware/                   # Express middleware
│   │   ├── auth.middleware.js       # JWT authentication
│   │   └── multer.middleware.js     # File upload handling
│   │
│   ├── Db/                           # Database configuration
│   │   └── Db.js                    # OracleDB connection
│   │
│   ├── utils/                        # Utility functions
│   │   └── transporter.js           # Email configuration
│   │
│   ├── public/                       # Static files
│   ├── .env                          # Environment variables
│   ├── .gitignore                    # Git ignore rules
│   ├── index.js                      # Entry point
│   └── package.json                  # Dependencies
│
└── frontend/
    └── bidwaza/                      # React + Vite application
        ├── src/
        │   ├── Pages/                # Page components
        │   │   ├── buyer/            # Buyer-specific pages
        │   │   │   ├── Home.jsx      # Product listing
        │   │   │   ├── Login.jsx
        │   │   │   ├── Signup.jsx
        │   │   │   ├── Verification.jsx
        │   │   │   ├── Profile.jsx
        │   │   │   ├── Cart.jsx
        │   │   │   ├── BuyProduct.jsx
        │   │   │   ├── Productinfo.jsx
        │   │   │   ├── Orders.jsx
        │   │   │   ├── Mybidspage.jsx
        │   │   │   ├── Wallet.jsx
        │   │   │   └── Uploadpfp.jsx
        │   │   │
        │   │   ├── seller/           # Seller-specific pages
        │   │   │   ├── SellerDashboard.jsx
        │   │   │   ├── Overview.jsx
        │   │   │   ├── Listing.jsx
        │   │   │   ├── Order.jsx
        │   │   │   ├── ComprehensiveAnalytics.jsx
        │   │   │   └── CommingSoon.jsx
        │   │   │
        │   │   ├── PaymentSuccess.jsx
        │   │   ├── PaymentFailure.jsx
        │   │   ├── ForgetPassword.jsx
        │   │   ├── VerifyPasswordReset.jsx
        │   │   └── ResetPassword.jsx
        │   │
        │   ├── Components/            # Reusable components
        │   │   ├── Cards.jsx
        │   │   ├── ProductInfoCard.jsx
        │   │   ├── ChangePasswordModal.jsx
        │   │   ├── Header/
        │   │   │   └── Navbar.jsx
        │   │   ├── buyer/
        │   │   │   ├── BidModal.jsx
        │   │   │   ├── AutoBidModal.jsx
        │   │   │   ├── FilterModal.jsx
        │   │   │   ├── OrderCard.jsx
        │   │   │   ├── ProductReviews.jsx
        │   │   │   └── Sellerbadge.jsx
        │   │   └── seller/
        │   │       ├── Analytics.jsx
        │   │       ├── BidHistoryModal.jsx
        │   │       ├── CreateListingModal.jsx
        │   │       ├── ListingCard.jsx
        │   │       ├── ManageOrder.jsx
        │   │       ├── PerformanceMetrics.jsx
        │   │       ├── RecentActivity.jsx
        │   │       ├── SellerNavbar.jsx
        │   │       ├── SellerSidebar.jsx
        │   │       └── StatsCard.jsx
        │   │
        │   ├── Context/               # React Context
        │   │   ├── Authcontext.jsx
        │   │   └── SocketContext.jsx
        │   │
        │   ├── Layouts/               # Layout components
        │   │   ├── Layout.jsx
        │   │   └── UserLayout.jsx
        │   │
        │   ├── hooks/                 # Custom hooks
        │   │   └── usePayment.js
        │   │
        │   ├── services/              # API services
        │   │   ├── sellerservices.js
        │   │   └── userservices.js
        │   │
        │   ├── API/                   # Axios API configuration
        │   │   └── api.js
        │   │
        │   ├── utils/                 # Utility functions
        │   │   └── product.js
        │   │
        │   ├── assets/                # Images, icons, etc.
        │   ├── App.jsx                # Main App component
        │   ├── App.css
        │   ├── main.jsx               # React entry point
        │   └── index.css
        │
        ├── public/                    # Static assets
        ├── index.html                 # HTML template
        ├── vite.config.js             # Vite configuration
        ├── eslint.config.js           # ESLint configuration
        ├── package.json               # Dependencies
        └── README.md
```

---

## 🚀 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js v5.1.0
- **Database:** OracleDB v6.9.0
- **Authentication:** JWT (jsonwebtoken v9.0.2)
- **Real-time:** Socket.io v4.8.1
- **Caching:** Redis v5.8.2
- **Image Upload:** Cloudinary v2.7.0
- **Email:** Nodemailer v7.0.6
- **Password Hash:** Bcryptjs v3.0.2
- **File Upload:** Multer v2.0.2

### Frontend
- **Framework:** React v19.1.1
- **Build Tool:** Vite v7.1.2
- **Routing:** React Router DOM v7.8.2
- **Styling:** Tailwind CSS v4.1.12
- **HTTP Client:** Axios v1.11.0
- **Real-time:** Socket.io Client v4.8.1
- **Animation:** Framer Motion v12.23.12
- **Charts:** Recharts v3.3.0
- **Notifications:** React Hot Toast v2.6.0
- **Icons:** Lucide React v0.541.0
- **Spreadsheet:** XLSX v0.18.5

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- OracleDB
- Redis
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the backend directory with the following variables:
   ```env
   JWT_SECRET=your_jwt_secret_here
   REDIS_URL=redis://localhost:6379
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   ORACLE_USER=system
   ORACLE_PASSWORD=your_oracle_password
   ORACLE_CONNECT_STRING=localhost/XEPDB1
   ESEWA_SECRET_KEY=your_esewa_secret_key
   ESEWA_GATEWAY_URL=https://rc-epay.esewa.com.np
   ESEWA_PRODUCT_CODE=EPAYTEST
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:3000` (or configured port)

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend/bidwaza
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📡 API Endpoints

### Authentication (`/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /sendverificationCode` - Send email verification
- `POST /verifyCode` - Verify email code
- `POST /resendCode` - Resend verification code
- `POST /forgetpassword` - Initiate password reset
- `POST /verify-password-reset-code` - Verify reset code
- `POST /reset-password` - Reset password
- `PUT /update-password` - Update password (authenticated)
- `POST /getCurrentUser` - Get current user info (authenticated)

### User Management (`/user`)
- Manage user profiles
- Update user information
- View user details

### Seller Management (`/seller`)
- Create and manage product listings
- View seller dashboard
- Manage seller profile

### Auction (`/auction`)
- `POST /placeBid` - Place a bid on an auction
- `POST /registerForProduct` - Register for auction participation
- `GET /auction/:itemId` - Get auction details with bid history
- `GET /myBids` - Get user's active bids
- `GET /wins` - Get won auctions
- `POST /setAutoBid` - Set automatic bidding
- `GET /getAutoBid` - Get auto bid details
- `POST /cancelAutoBid` - Cancel automatic bid
- `GET /notifications` - Get auction notifications
- `PUT /setNotificationAsRead` - Mark notifications as read

### Shopping Cart (`/cart`)
- Add items to cart
- Remove items from cart
- Update cart quantities
- View cart items

### Payments (`/esewa`)
- Integrate with eSeWa payment gateway
- Handle payment callbacks
- Verify payment status

### Wallet (`/wallet`)
- View wallet balance
- Add funds to wallet
- Transaction history
- Manage wallet credits

### Analytics (`/analytics`)
- Seller performance metrics
- Sales statistics
- Bid history analytics
- Revenue reports

---

## 🔐 Authentication Flow

1. **User Registration:**
   - User provides email, password, name, and interests
   - Password is hashed with bcryptjs
   - Verification email is sent

2. **Email Verification:**
   - User receives 6-digit verification code
   - Code must be verified within 24 hours

3. **Login:**
   - User credentials validated against database
   - JWT token generated and stored in cookies
   - Token required for protected endpoints

4. **Password Reset:**
   - User requests password reset with email
   - Reset code sent via email
   - Code verified before allowing new password

---

## 🎯 Key Features

### For Buyers
- Browse and search for auction items
- Place bids with auto-bidding capability
- Add items to shopping cart
- Checkout with multiple payment options
- View bidding history and won auctions
- Digital wallet for faster transactions
- Order tracking and management
- Product reviews and ratings
- User profile management

### For Sellers
- Create and manage product listings
- Real-time bid monitoring
- Comprehensive analytics dashboard
- Performance metrics and statistics
- Order management system
- Seller badge and reputation system
- Revenue tracking
- Bid history analysis
- Recent activity monitoring

### General
- Real-time WebSocket communication
- Responsive design with Tailwind CSS
- Email notifications
- Secure JWT authentication
- Cloudinary image management
- Redis caching
- eSeWa payment integration

---

## 🔄 Real-time Features

The application uses **Socket.io** for real-time communication:

- **Live Bidding Updates:** Instant bid notifications
- **Auction Status:** Real-time auction state changes
- **Notifications:** Push notifications for bid activities
- **Active Users:** See who's bidding in real-time

---

## 📊 Database Schema (OracleDB)

### Core Tables

#### **users**
User account information and authentication
```
ID                    - NOT NULL NUMBER (Primary Key)
FIRST_NAME            - NOT NULL VARCHAR2(50)
LAST_NAME             - NOT NULL VARCHAR2(50)
EMAIL                 - NOT NULL VARCHAR2(100) (Unique)
PASSWORD              - NOT NULL VARCHAR2(200) (Hashed)
INTERESTS             - VARCHAR2(200)
PROFILE_PICTURE_URL   - VARCHAR2(500)
CREATED_AT            - TIMESTAMP(6)
UPDATED_AT            - TIMESTAMP(6)
```

#### **products**
Product/auction listings
```
ITEM_ID               - NOT NULL NUMBER (Primary Key)
SELLER_ID             - NOT NULL NUMBER (FK: users.ID)
TITLE                 - NOT NULL VARCHAR2(100)
DESCRIPTION           - CLOB
CATEGORY              - VARCHAR2(50)
STOCK                 - NUMBER
PRODUCT_TYPE          - NOT NULL VARCHAR2(20)
AMOUNT                - NOT NULL NUMBER(10,2)
STATUS                - VARCHAR2(20)
STARTING_PRICE        - NUMBER(10,2)
CURRENT_PRICE         - NUMBER(10,2)
START_TIME            - TIMESTAMP(6)
END_TIME              - TIMESTAMP(6)
REGISTRATION_END      - TIMESTAMP(6)
CREATED_AT            - TIMESTAMP(6)
UPDATED_AT            - TIMESTAMP(6)
```

#### **product_images**
Product image storage
```
IMAGE_ID              - NOT NULL NUMBER (Primary Key)
ITEM_ID               - NOT NULL NUMBER (FK: products.ITEM_ID)
IMAGE_URL             - NOT NULL VARCHAR2(500)
IS_PRIMARY            - CHAR(1)
DISPLAY_ORDER         - NUMBER
CREATED_AT            - TIMESTAMP(6)
```

### Auction & Bidding Tables

#### **bids**
Auction bidding history
```
BID_ID                - NOT NULL NUMBER (Primary Key)
ITEM_ID               - NOT NULL NUMBER (FK: products.ITEM_ID)
USER_ID               - NOT NULL NUMBER (FK: users.ID)
BID_AMOUNT            - NOT NULL NUMBER(10,2)
BID_STATUS            - VARCHAR2(20)
CREATED_AT            - TIMESTAMP(6)
UPDATED_AT            - TIMESTAMP(6)
```

#### **auction_registrations**
User registration for auction participation
```
REGISTRATION_ID       - NOT NULL NUMBER (Primary Key)
ITEM_ID               - NOT NULL NUMBER (FK: products.ITEM_ID)
USER_ID               - NOT NULL NUMBER (FK: users.ID)
REGISTERED_AT         - TIMESTAMP(6)
IS_ACTIVE             - CHAR(1)
```

#### **auto_bids**
Automatic bidding configuration
```
AUTO_BID_ID           - NOT NULL NUMBER (Primary Key)
USER_ID               - NOT NULL NUMBER (FK: users.ID)
ITEM_ID               - NOT NULL NUMBER (FK: products.ITEM_ID)
MAX_BID_AMOUNT        - NOT NULL NUMBER(10,2)
INCREMENT_AMOUNT      - NUMBER(10,2)
IS_ACTIVE             - CHAR(1)
CREATED_AT            - TIMESTAMP(6)
UPDATED_AT            - TIMESTAMP(6)
```

#### **auction_winners**
Auction winners and winning bids
```
WINNER_ID             - NOT NULL NUMBER (Primary Key)
ITEM_ID               - NOT NULL NUMBER (FK: products.ITEM_ID)
USER_ID               - NOT NULL NUMBER (FK: users.ID)
WINNING_BID           - NOT NULL NUMBER(10,2)
PAYMENT_STATUS        - VARCHAR2(20)
PAYMENT_DATE          - TIMESTAMP(6)
CREATED_AT            - TIMESTAMP(6)
```

### Shopping & Orders Tables

#### **cart_items**
Shopping cart management
```
CART_ITEM_ID          - NOT NULL NUMBER (Primary Key)
USER_ID               - NOT NULL NUMBER (FK: users.ID)
ITEM_ID               - NOT NULL NUMBER (FK: products.ITEM_ID)
QUANTITY              - NUMBER
ADDED_AT              - TIMESTAMP(6)
```

#### **orders**
Order information and status tracking
```
ORDER_ID              - NOT NULL NUMBER (Primary Key)
USER_ID               - NOT NULL NUMBER (FK: users.ID)
ORDER_NUMBER          - NOT NULL VARCHAR2(50) (Unique)
TOTAL_AMOUNT          - NOT NULL NUMBER(10,2)
ORDER_STATUS          - VARCHAR2(20)
PAYMENT_STATUS        - VARCHAR2(20)
ESEWA_TXN_ID          - VARCHAR2(100)
PAYMENT_METHOD        - VARCHAR2(50)
ORDER_DATE            - TIMESTAMP(6)
UPDATED_AT            - TIMESTAMP(6)
```

#### **order_items**
Individual items within orders
```
ORDER_ITEM_ID         - NOT NULL NUMBER (Primary Key)
ORDER_ID              - NOT NULL NUMBER (FK: orders.ORDER_ID)
ITEM_ID               - NOT NULL NUMBER (FK: products.ITEM_ID)
SELLER_ID             - NOT NULL NUMBER (FK: users.ID)
PRODUCT_TITLE         - NOT NULL VARCHAR2(100)
PRICE_AT_PURCHASE     - NOT NULL NUMBER(10,2)
QUANTITY              - NOT NULL NUMBER
SUBTOTAL              - NOT NULL NUMBER(10,2)
CREATED_AT            - TIMESTAMP(6)
```

### Wallet & Payment Tables

#### **wallets**
User wallet account balances
```
WALLET_ID             - NOT NULL NUMBER (Primary Key)
USER_ID               - NOT NULL NUMBER (FK: users.ID)
BALANCE               - NUMBER(12,2)
LAST_UPDATED          - TIMESTAMP(6)
```

#### **wallet_topup_history**
Wallet transaction history
```
TRANSACTION_ID        - NOT NULL NUMBER (Primary Key)
WALLET_ID             - NOT NULL NUMBER (FK: wallets.WALLET_ID)
AMOUNT                - NOT NULL NUMBER(12,2)
TRANSACTION_TYPE      - VARCHAR2(50)
PAYMENT_METHOD        - VARCHAR2(100)
STATUS                - VARCHAR2(50)
REFERENCE_ID          - VARCHAR2(255)
CREATED_AT            - TIMESTAMP(6)
```

#### **wallet_holds**
Wallet amount holds for active bids
```
HOLD_ID               - NOT NULL NUMBER (Primary Key)
WALLET_ID             - NOT NULL NUMBER (FK: wallets.WALLET_ID)
BID_ID                - NOT NULL NUMBER (FK: bids.BID_ID)
AMOUNT                - NOT NULL NUMBER(10,2)
STATUS                - VARCHAR2(20)
CREATED_AT            - TIMESTAMP(6)
RELEASED_AT           - TIMESTAMP(6)
```

### Notifications & Reviews Tables

#### **notifications**
User notifications and alerts
```
NOTIFICATION_ID       - NOT NULL NUMBER (Primary Key)
USER_ID               - NOT NULL NUMBER (FK: users.ID)
TYPE                  - NOT NULL VARCHAR2(50)
TITLE                 - NOT NULL VARCHAR2(200)
MESSAGE               - NOT NULL VARCHAR2(500)
ITEM_ID               - NUMBER (FK: products.ITEM_ID)
IS_READ               - CHAR(1)
CREATED_AT            - TIMESTAMP(6)
```

#### **ratings_reviews**
Product reviews and ratings
```
REVIEW_ID             - NOT NULL NUMBER (Primary Key)
ORDER_ITEM_ID         - NOT NULL NUMBER (FK: order_items.ORDER_ITEM_ID)
PRODUCT_ID            - NOT NULL NUMBER (FK: products.ITEM_ID)
USER_ID               - NOT NULL NUMBER (FK: users.ID)
RATING                - NOT NULL NUMBER(1) (1-5)
REVIEW_TEXT           - CLOB
CREATED_AT            - NOT NULL TIMESTAMP(6)
UPDATED_AT            - NOT NULL TIMESTAMP(6)
```

---

## 🛠️ Development Scripts

### Backend
```bash
npm start          # Start with nodemon (development)
npm test           # Run tests
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 📦 Dependencies Summary

### Backend Key Dependencies
- **express** - Web framework
- **oracledb** - Oracle database driver
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **socket.io** - Real-time communication
- **multer** - File upload
- **cloudinary** - Image hosting
- **nodemailer** - Email service
- **redis** - Caching

### Frontend Key Dependencies
- **react** - UI library
- **react-router-dom** - Routing
- **axios** - HTTP client
- **tailwindcss** - Styling
- **socket.io-client** - Real-time client
- **framer-motion** - Animations
- **recharts** - Charts
- **react-hot-toast** - Notifications

---

## 🔒 Security Features

- JWT-based authentication with cookie storage
- Password hashing with bcryptjs
- CORS configuration for trusted origins
- Input validation on all endpoints
- Protected routes with authentication middleware
- Secure eSeWa payment integration
- Email verification for account protection
- Password reset with email verification

---

## 🚀 Deployment

### Backend Deployment
1. Set all environment variables in production
2. Configure OracleDB connection for production
3. Set `NODE_ENV=production`
4. Deploy using services like Heroku, AWS, or DigitalOcean

### Frontend Deployment
1. Build the application: `npm run build`
2. Upload `dist/` folder to hosting service
3. Configure API endpoint for production backend
4. Deploy using Vercel, Netlify, or GitHub Pages

---

## 📝 Environment Variables

### Backend `.env`
```
JWT_SECRET - Secret key for JWT tokens
REDIS_URL - Redis connection URL
EMAIL_USER - Gmail account for sending emails
EMAIL_PASS - Gmail app-specific password
CLOUDINARY_API_KEY - Cloudinary API key
CLOUDINARY_API_SECRET - Cloudinary API secret
CLOUDINARY_CLOUD_NAME - Cloudinary cloud name
ORACLE_USER - Oracle database username
ORACLE_PASSWORD - Oracle database password
ORACLE_CONNECT_STRING - Oracle connection string
ESEWA_SECRET_KEY - eSeWa payment gateway secret
ESEWA_GATEWAY_URL - eSeWa API endpoint
ESEWA_PRODUCT_CODE - eSeWa product code
FRONTEND_URL - Frontend application URL
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

ISC License

---

## 👥 Author

Bidwaza Development Team

---

## 📞 Support

For issues or questions:
- Open an issue on the repository
- Contact: bidwaza@gmail.com

---

## 🎉 Features Coming Soon

- Advanced seller rating system
- Auction scheduling
- Bulk product uploads
- API rate limiting
- SMS notifications
- Mobile application
- Cryptocurrency payments
- International shipping support

---

**Last Updated:** December 2025

Happy Bidding! 🏆

---
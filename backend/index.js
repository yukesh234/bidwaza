import express from 'express';
import authrouter from './Routes/auth.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();
import user from './Routes/user.js'

//seller route
import seller from './Routes/seller.js'

//cart route
import cart from './Routes/cart.js'

//esewa route
import esewa from './Routes/esewa.js'
app.use(cors({
  origin: "http://localhost:5173",  
  credentials: true                 
}));
app.use(cookieParser());
app.use(express.json());
// Use your routes
app.use("/", authrouter);
app.use("/user", user);
app.use("/seller", seller);
app.use("/cart",cart);
app.use("/esewa",esewa);
app.listen(3000, () => {
  console.log(`Server started on port 3000`);
});
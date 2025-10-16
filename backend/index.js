import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Route imports
import authrouter from './Routes/auth.js';
import user from './Routes/user.js';
import seller from './Routes/seller.js';
import cart from './Routes/cart.js';
import esewa from './Routes/esewa.js';

const app = express();

// Create HTTP server (required for socket.io)
const httpServer = createServer(app);

// Initialize socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/", authrouter);
app.use("/user", user);
app.use("/seller", seller);
app.use("/cart", cart);
app.use("/esewa", esewa);
app.get("/", (req,res)=> res.send({message:"Hello"}));


// Socket.io connection event
io.on('connection', (socket) => {
  console.log(` User connected: ${socket.id}`);

  // Example: receive and send message
  socket.on('sendMessage', (data) => {
    console.log(' Message received:', data);
    // Emit message to specific user (if needed)
    io.emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {
    console.log(` User disconnected: ${socket.id}`);
  });
});

// Start the HTTP server (not app.listen)
const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server and Socket.IO running on port ${PORT}`);
});

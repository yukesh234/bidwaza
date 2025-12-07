import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './Authcontext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeAuctions, setActiveAuctions] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setConnected(true);
      
      // Rejoin active auctions after reconnection
      activeAuctions.forEach(itemId => {
        newSocket.emit('join-auction', itemId);
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Listen for bid updates
    newSocket.on('bid-update', (data) => {
      console.log('📢 Bid update received:', data);
      // This will be handled by individual auction pages
    });

    // Listen for outbid notifications
    newSocket.on('outbid-notification', (data) => {
      console.log('🔔 You were outbid:', data);
      toast.error(`You've been outbid on "${data.productTitle}"!`, {
        duration: 5000,
        icon: '🔔',
      });
    });

    // Listen for auction won notifications
    newSocket.on('auction-won', (data) => {
      console.log('🏆 You won the auction:', data);
      toast.success(`Congratulations! You won "${data.productTitle}"!`, {
        duration: 8000,
        icon: '🏆',
      });
    });

    // Listen for auction ending soon
    newSocket.on('auction-ending', (data) => {
      console.log('⏰ Auction ending soon:', data);
      toast(`Auction "${data.productTitle}" ending in ${data.timeLeft}!`, {
        duration: 5000,
        icon: '⏰',
      });
    });

    // Listen for auction ended
    newSocket.on('auction-ended', (data) => {
      console.log('🏁 Auction ended:', data);
      if (data.isWinner) {
        toast.success(`You won the auction for "${data.productTitle}"!`, {
          duration: 8000,
          icon: '🏆',
        });
      } else if (data.hadBid) {
        toast(`Auction ended for "${data.productTitle}". Better luck next time!`, {
          duration: 5000,
          icon: '📢',
        });
      }
    });

    // 🤖 AUTO-BID EVENTS
    // Listen for auto-bid placed notifications
    newSocket.on('autobid-placed', (data) => {
      console.log('🤖 Auto-bid placed:', data);
      toast.success(
        `Auto-bid placed: रु${data.bidAmount.toLocaleString()}. Remaining max: रु${data.remainingMax.toLocaleString()}`,
        {
          duration: 6000,
          icon: '🤖',
        }
      );
    });

    // Listen for auto-bid max reached
    newSocket.on('autobid-max-reached', (data) => {
      console.log('⚠️ Auto-bid max reached:', data);
      toast.error(
        `Auto-bid maximum reached! Your max bid of रु${data.maxBidAmount.toLocaleString()} has been reached. Current price: रु${data.currentBidAmount.toLocaleString()}`,
        {
          duration: 8000,
          icon: '⚠️',
        }
      );
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Join auction room
  const joinAuction = useCallback((itemId) => {
    if (socket && connected) {
      socket.emit('join-auction', itemId);
      setActiveAuctions(prev => new Set(prev).add(itemId));
      console.log(`🏠 Joined auction room: ${itemId}`);
    }
  }, [socket, connected]);

  // Leave auction room
  const leaveAuction = useCallback((itemId) => {
    if (socket && connected) {
      socket.emit('leave-auction', itemId);
      setActiveAuctions(prev => {
        const updated = new Set(prev);
        updated.delete(itemId);
        return updated;
      });
      console.log(`🚪 Left auction room: ${itemId}`);
    }
  }, [socket, connected]);

  // Place a bid via socket
  const placeBid = useCallback((itemId, bidAmount) => {
    return new Promise((resolve, reject) => {
      if (!socket || !connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('place-bid', { itemId, bidAmount }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message || 'Failed to place bid'));
        }
      });
    });
  }, [socket, connected]);

  const value = {
    socket,
    connected,
    joinAuction,
    leaveAuction,
    placeBid,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
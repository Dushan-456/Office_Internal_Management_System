import { Server } from "socket.io";

let io;

export const initIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
       if (userId) {
         socket.join(userId.toString());
         console.log(`User ${userId} joined their notification room.`);
       }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected from socket.");
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Simplified helper to emit to a specific user
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
  }
};

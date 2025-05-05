import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Types
type Users = { [key: string]: string };

type SignalPayload = {
  roomId: string;
  type: "offer" | "answer" | "ice-candidate";
  data: any;
};

let users: Users = {}; // Store connected users

io.on("connection", (socket: Socket) => {
  const { callerId } = socket.handshake.query as { callerId?: string };

  if (callerId) {
    users[callerId] = socket.id;
    console.log(`User connected: ${callerId}, Socket ID: ${socket.id}`);
  }

  // Invite a user to call
  socket.on(
    "inviteToCall",
    ({ calleeId, roomId }: { calleeId: string; roomId: string }) => {
      const calleeSocketId = users[calleeId];
      if (calleeSocketId) {
        io.to(calleeSocketId).emit("incomingCall", { callerId, roomId });
      }
    }
  );

  // Respond to call invitation
  socket.on(
    "inviteResponse",
    ({
      callerId,
      accepted,
      roomId,
    }: {
      callerId: string;
      accepted: boolean;
      roomId: string;
    }) => {
      const callerSocketId = users[callerId];
      if (callerSocketId) {
        io.to(callerSocketId).emit("inviteResponse", { accepted, roomId });
      }
    }
  );

  // Join a call room
  socket.on("joinRoom", ({ roomId }: { roomId: string }) => {
    socket.join(roomId);
    console.log(`Socket ${callerId} joined room ${roomId}`);
    socket.to(roomId).emit("roomJoined", { roomId });
  });

  // Handle WebRTC signaling
  socket.on("signal", ({ roomId, type, data }: SignalPayload) => {
    console.log("SIGNAL", roomId, type);
    socket.to(roomId).emit("signal", { type, data });
    // use socket.to to prevent echoing back to sender
  });

  // End call
  socket.on("endCall", ({ roomId }: { roomId: string }) => {
    io.to(roomId).emit("callEnded");
    io.in(roomId).socketsLeave(roomId); // All sockets leave the room
    console.log(`Call ended and room ${roomId} closed.`);
  });

  // Disconnect cleanup
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${callerId}`);
    if (callerId) {
      delete users[callerId];
    }
  });
});

// Start server
const PORT = process.env.PORT || 3500;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

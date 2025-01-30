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

type Users = { [key: string]: string };

let users: Users = {}; // Store connected users

io.on("connection", (socket: Socket) => {
  const { callerId } = socket.handshake.query as { callerId?: string };
  if (callerId) {
    users[callerId] = socket.id;
  }
  console.log(`User connected: ${callerId}, Socket ID: ${socket.id}`);

  socket.on(
    "call",
    ({
      calleeId,
      rtcMessage,
      roomId,
    }: {
      calleeId: string;
      rtcMessage: any;
      roomId: string;
    }) => {
      if (users[calleeId]) {
        io.to(users[calleeId]).emit("newCall", {
          callerId,
          rtcMessage,
          roomId,
        });
      }
    }
  );

  socket.on(
    "answerCall",
    ({
      callerId,
      rtcMessage,
      roomId,
    }: {
      callerId: string;
      rtcMessage: any;
      roomId: string;
    }) => {
      if (users[callerId]) {
        io.to(users[callerId]).emit("callAnswered", { rtcMessage, roomId });
      }
    }
  );

  socket.on(
    "ICEcandidate",
    ({ calleeId, rtcMessage }: { calleeId: string; rtcMessage: any }) => {
      if (users[calleeId]) {
        io.to(users[calleeId]).emit("ICEcandidate", { rtcMessage });
      }
    }
  );

  socket.on(
    "endCall",
    ({ calleeId, roomId }: { calleeId: string; roomId: string }) => {
      if (users[calleeId]) {
        io.to(users[calleeId]).emit("callEnded", { roomId });
      }
    }
  );

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${callerId}`);
    if (callerId) {
      delete users[callerId];
    }
  });
});

const PORT = process.env.PORT || 3500;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

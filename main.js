const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("WebRTC Signaling Server");
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("New user connected");
  socket.on("join", (data) => {
    const { name, room } = data;
    socket.join(room);
    console.log(`${name} joined room ${room}`);

    if (!rooms.has(room)) {
      console.log("Creating new room", room);
      rooms.set(room, { users: new Map() });
    }
    const roomData = rooms.get(room);

    if (roomData.users.has(socket.id)) {
      return;
    }
    roomData.users.set(socket.id, name);

    if (roomData.users.size === 2) {
      socket.broadcast.emit("start");
    }
  });

  socket.on("offer", (data) => {
    console.log("Received offer");
    socket.broadcast.emit("offer", data);
  });

  socket.on("answer", (data) => {
    console.log("Received answer");
    socket.broadcast.emit("answer", data);
  });

  socket.on("ice_candidate", (data) => {
    console.log("Received ICE candidate");
    socket.broadcast.emit("ice_candidate", data);
  });

  socket.on("disconnect", () => {
    for (const [room, data] of rooms.entries()) {
      const user = data.users.get(socket.id);
      if (user) {
        console.log(`${user} left room ${room}`);
        data.users.delete(socket.id);
        if (data.users.size === 0) {
          console.log(room, "Room is empty. Deleting room");
          rooms.delete(room);
        }
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let users = [];

io.on("connection", (socket) => {

  console.log("Usuario conectado:", socket.id);

  users.push(socket.id);

  socket.on("join", () => {

    console.log("JOIN:", socket.id);

    // SI HAY 2 USUARIOS
    if (users.length >= 2) {

      const caller = users[0];
      const receiver = users[1];

      io.to(caller).emit("create_offer", {
        target: receiver
      });

    }

  });

  // =========================
  // OFFER
  // =========================
  socket.on("offer", (data) => {

    io.to(data.target).emit("offer", {
      sdp: data.sdp,
      type: data.type,
      sender: socket.id
    });

  });

  // =========================
  // ANSWER
  // =========================
  socket.on("answer", (data) => {

    io.to(data.target).emit("answer", {
      sdp: data.sdp,
      type: data.type
    });

  });

  // =========================
  // CANDIDATE
  // =========================
  socket.on("candidate", (data) => {

    io.to(data.target).emit("candidate", {
      candidate: data.candidate,
      sdpMid: data.sdpMid,
      sdpMLineIndex: data.sdpMLineIndex
    });

  });

  socket.on("disconnect", () => {

    console.log("Usuario desconectado:", socket.id);

    users = users.filter((id) => id !== socket.id);

  });

});

server.listen(3000, () => {

  console.log("Servidor corriendo");

});

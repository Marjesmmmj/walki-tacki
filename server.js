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

io.on("connection", (socket) => {

  console.log("Usuario conectado:", socket.id);

  // =========================
  // JOIN ROOM
  // =========================
  socket.on("join", (room) => {

    socket.join(room);

    console.log(`${socket.id} se unió a ${room}`);

  });

  // =========================
  // OFFER
  // =========================
  socket.on("offer", (data) => {

    console.log("OFFER");

    socket.broadcast.emit("offer", data);

  });

  // =========================
  // ANSWER
  // =========================
  socket.on("answer", (data) => {

    console.log("ANSWER");

    socket.broadcast.emit("answer", data);

  });

  // =========================
  // ICE CANDIDATE
  // =========================
  socket.on("candidate", (data) => {

    console.log("CANDIDATE");

    socket.broadcast.emit("candidate", data);

  });

  // =========================
  // PING
  // =========================
  socket.on("ping_server", () => {

    console.log("PING");

    socket.emit("pong");

  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {

    console.log("Usuario desconectado:", socket.id);

  });

});

server.listen(3000, () => {

  console.log("Servidor corriendo en puerto 3000");

});

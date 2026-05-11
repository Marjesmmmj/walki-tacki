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

  // =========================
  // JOIN
  // =========================
  socket.on("join", () => {

    // evitar duplicados
    if (!users.includes(socket.id)) {
      users.push(socket.id);
    }

    console.log("JOIN:", socket.id);

    console.log("USUARIOS:", users);

    // SI HAY 2 USUARIOS
    if (users.length >= 2) {

      const caller = users[0];
      const receiver = users[1];

      console.log("CREANDO OFFER:", caller, "->", receiver);

      io.to(caller).emit("create_offer", {
        target: receiver,
      });

    }

  });

  // =========================
  // OFFER
  // =========================
  socket.on("offer", (data) => {

    console.log("OFFER:", socket.id, "->", data.target);

    io.to(data.target).emit("offer", {
      sdp: data.sdp,
      type: data.type,
      sender: socket.id,
    });

  });

  // =========================
  // ANSWER
  // =========================
  socket.on("answer", (data) => {

    console.log("ANSWER:", socket.id, "->", data.target);

    io.to(data.target).emit("answer", {
      sdp: data.sdp,
      type: data.type,
      sender: socket.id,
    });

  });

  // =========================
  // ICE CANDIDATE
  // =========================
  socket.on("candidate", (data) => {

    if (!data.target) return;

    io.to(data.target).emit("candidate", {
      candidate: data.candidate,
      sdpMid: data.sdpMid,
      sdpMLineIndex: data.sdpMLineIndex,
      sender: socket.id,
    });

  });

  // =========================
  // PING
  // =========================
  socket.on("ping_server", () => {

    socket.emit("pong");

  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {

    console.log("Usuario desconectado:", socket.id);

    users = users.filter((id) => id !== socket.id);

    console.log("USUARIOS:", users);

  });

});

server.listen(3000, () => {

  console.log("Servidor corriendo en puerto 3000");

});

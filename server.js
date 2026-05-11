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
    methods: ["GET", "POST"],
  },
});

// =========================
// CONEXIÓN
// =========================
io.on("connection", (socket) => {

  console.log("Usuario conectado:", socket.id);

  // =========================
  // JOIN ROOM
  // =========================
  socket.on("join", (room) => {

    socket.join(room);

    console.log(`${socket.id} se unió a ${room}`);

    // usuarios dentro de la sala
    const roomUsers = Array.from(
      io.sockets.adapter.rooms.get(room) || []
    );

    console.log("Usuarios en sala:", roomUsers.length);

    // si hay 2 o más -> crear offer
    if (roomUsers.length >= 2) {

      // el último que entró crea la oferta
      io.to(socket.id).emit("create_offer");

      console.log("CREATE OFFER ENVIADO");

    }

  });

  // =========================
  // OFFER
  // =========================
  socket.on("offer", (data) => {

    console.log("OFFER");

    // enviar a todos menos al emisor
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

    socket.emit("pong");

  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {

    console.log("Usuario desconectado:", socket.id);

  });

});

// =========================
// START SERVER
// =========================
server.listen(3000, "0.0.0.0", () => {

  console.log("Servidor corriendo en puerto 3000");

});

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

  // 🔥 unirse a canal
  socket.on("join", (room) => {

    socket.join(room);

    console.log(`${socket.id} se unió a ${room}`);

  });

  // 🔥 AUDIO
  socket.on("voice_chunk", (data) => {

    // enviar audio a todos menos al emisor
    socket.broadcast.emit("voice_chunk", data);

  });

  // 🔥 desconexión
  socket.on("disconnect", () => {

    console.log("Usuario desconectado:", socket.id);

  });

  socket.on("ping_server", () => {

  console.log("PING");

  socket.emit("pong");

});
});


server.listen(3000, () => {

  console.log("Servidor corriendo en puerto 3000");

});

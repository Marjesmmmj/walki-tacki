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

// =========================
// USUARIOS CONECTADOS
// =========================
let users = [];

io.on("connection", (socket) => {

  console.log("🔌 Conectado:", socket.id);

  // =========================
  // JOIN
  // =========================
  socket.on("join", (data) => {

    try {

      console.log("📡 JOIN:", socket.id);

      const alias = data?.alias || "Anonimo";

      // evitar duplicados
      const exists = users.find(
        (u) => u.id === socket.id
      );

      if (!exists) {

        users.push({
          id: socket.id,
          alias: alias,
        });

      }

      console.log("👥 USERS:", users);

      // ENVIAR LISTA A TODOS
      io.emit("users_list", users);

      // =========================
      // AVISAR USUARIOS EXISTENTES
      // =========================
      users.forEach((user) => {

        if (user.id !== socket.id) {

          // avisar usuarios viejos
          io.to(user.id).emit("new_peer", {
            target: socket.id,
            alias: alias,
          });

          // avisar nuevo usuario
          socket.emit("new_peer", {
            target: user.id,
            alias: user.alias,
          });

          console.log(
            "🤝 NUEVO PEER:",
            socket.id,
            "<->",
            user.id
          );

        }

      });

    } catch (e) {

      console.log("❌ ERROR JOIN:", e);

    }

  });

  // =========================
  // OFFER
  // =========================
  socket.on("offer", (data) => {

    try {

      if (!data) {
        console.log("❌ OFFER NULL");
        return;
      }

      if (!data.target) {
        console.log("❌ OFFER SIN TARGET");
        return;
      }

      console.log("📤 OFFER:", socket.id, "->", data.target);

      io.to(data.target).emit("offer", {
        sdp: data.sdp,
        type: data.type,
        sender: socket.id,
      });

    } catch (e) {

      console.log("❌ ERROR OFFER:", e);

    }

  });

  // =========================
  // ANSWER
  // =========================
  socket.on("answer", (data) => {

    try {

      if (!data) {
        console.log("❌ ANSWER NULL");
        return;
      }

      if (!data.target) {
        console.log("❌ ANSWER SIN TARGET");
        return;
      }

      console.log("📤 ANSWER:", socket.id, "->", data.target);

      io.to(data.target).emit("answer", {
        sdp: data.sdp,
        type: data.type,
        sender: socket.id,
      });

    } catch (e) {

      console.log("❌ ERROR ANSWER:", e);

    }

  });

  // =========================
  // ICE CANDIDATES
  // =========================
  socket.on("candidate", (data) => {

    try {

      if (!data) {
        console.log("❌ CANDIDATE NULL");
        return;
      }

      if (!data.target) {
        console.log("❌ CANDIDATE SIN TARGET");
        return;
      }

      io.to(data.target).emit("candidate", {
        candidate: data.candidate,
        sdpMid: data.sdpMid,
        sdpMLineIndex: data.sdpMLineIndex,
        sender: socket.id,
      });

    } catch (e) {

      console.log("❌ ERROR CANDIDATE:", e);

    }

  });

  // =========================
  // KEEP ALIVE
  // =========================
  socket.on("ping_server", () => {

    socket.emit("pong_server");

  });
// =========================
// TALKING
// =========================
socket.on("talking", (data) => {

  socket.broadcast.emit("user_talking", {
    id: socket.id,
    alias: data.alias,
    talking: data.talking,
  });

});
  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {

    console.log("❌ Desconectado:", socket.id,data.alias);

    // eliminar usuario
    users = users.filter(
      user => user.id !== socket.id
    );

    console.log("👥 USERS:", users);

    // reenviar lista actualizada
    io.emit("users_list", users);

    // avisar a todos
    socket.broadcast.emit("peer_disconnected", {
      id: socket.id,
    });

  });

});

server.listen(3000, "0.0.0.0", () => {

  console.log("🚀 WALKIE SERVER ALIAS ------------>3000");

});

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
  socket.on("join", () => {

    console.log("📡 JOIN:", socket.id);

    // evitar duplicados
    if (!users.includes(socket.id)) {
      users.push(socket.id);
    }

    console.log("👥 USERS:", users);

    // =========================
    // AVISAR USUARIOS EXISTENTES
    // =========================
    users.forEach((userId) => {

      if (userId !== socket.id) {

        // avisar a usuarios viejos del nuevo
        io.to(userId).emit("new_peer", {
          target: socket.id,
        });

        // avisar al nuevo de usuarios existentes
        socket.emit("new_peer", {
          target: userId,
        });

        console.log("🤝 NUEVO PEER:", socket.id, "<->", userId);
      }

    });

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
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {

    console.log("❌ Desconectado:", socket.id);

    // eliminar usuario
    users = users.filter(id => id !== socket.id);

    console.log("👥 USERS:", users);

    // avisar a todos
    socket.broadcast.emit("peer_disconnected", {
      id: socket.id,
    });

  });

});

server.listen(3000, "0.0.0.0", () => {

  console.log("🚀 WALKIE SERVER RUNNING ON PORT 3000");

});

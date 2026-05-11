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
// USUARIOS
// =========================
let waitingUser = null;

// guardar pares activos
const pairs = new Map();

io.on("connection", (socket) => {

  console.log("🔌 Conectado:", socket.id);

  // =========================
  // JOIN
  // =========================
  socket.on("join", () => {

    console.log("📡 JOIN:", socket.id);

    // evitar duplicados
    if (waitingUser === socket.id) {
      return;
    }

    // si no hay nadie esperando
    if (!waitingUser) {

      waitingUser = socket.id;

      console.log("⏳ Esperando pareja:", socket.id);

      socket.emit("waiting");

      return;
    }

    // evitar emparejar consigo mismo
    if (waitingUser === socket.id) {
      return;
    }

    // =========================
    // EMPAREJAR
    // =========================
    const caller = waitingUser;
    const receiver = socket.id;

    waitingUser = null;

    // guardar relación
    pairs.set(caller, receiver);
    pairs.set(receiver, caller);

    console.log("🎧 PAREJA CREADA");
    console.log("📞", caller, "<->", receiver);

    // 🔥 INICIAR WEBRTC
    io.to(caller).emit("create_offer", {
      target: receiver,
    });

    io.to(receiver).emit("ready", {
      target: caller,
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

    // quitar waiting
    if (waitingUser === socket.id) {
      waitingUser = null;
    }

    // avisar al compañero
    const partner = pairs.get(socket.id);

    if (partner) {

      io.to(partner).emit("peer_disconnected");

      pairs.delete(partner);
      pairs.delete(socket.id);

      console.log("💔 PAREJA ELIMINADA");

    }

  });

});

server.listen(3000, "0.0.0.0", () => {

  console.log("🚀 WALKIE SERVER RUNNING ON PORT 3000");

});

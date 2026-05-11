const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// 👥 SALA SIMPLE (ZELLO STYLE)
let waitingUser = null;

io.on("connection", (socket) => {

  console.log("🔌 Conectado:", socket.id);

  // =========================
  // JOIN RADIO
  // =========================
  socket.on("join", () => {

    console.log("📡 JOIN:", socket.id);

    // 🔥 si no hay nadie esperando
    if (!waitingUser) {
      waitingUser = socket.id;
      socket.emit("waiting");
      return;
    }

    // 🔥 emparejar
    const caller = waitingUser;
    const receiver = socket.id;

    waitingUser = null;

    console.log("🎧 PAIR:", caller, "->", receiver);

    io.to(caller).emit("call-start", { target: receiver });
    io.to(receiver).emit("call-start", { target: caller });
  });

  // =========================
  // OFFER
  // =========================
  socket.on("offer", (data) => {
    if (!data?.target) return;

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
    if (!data?.target) return;

    io.to(data.target).emit("answer", {
      sdp: data.sdp,
      type: data.type,
      sender: socket.id,
    });
  });

  // =========================
  // ICE
  // =========================
  socket.on("candidate", (data) => {
    if (!data?.target) return;

    io.to(data.target).emit("candidate", {
      candidate: data.candidate,
      sdpMid: data.sdpMid,
      sdpMLineIndex: data.sdpMLineIndex,
      sender: socket.id,
    });
  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    console.log("❌ Desconectado:", socket.id);

    if (waitingUser === socket.id) {
      waitingUser = null;
    }
  });

});

server.listen(3000, () => {
  console.log("🚀 Zello server running");
});

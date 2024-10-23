const app = require("express")();
const http = require("http").createServer(app);
const PORT = require("./config/config").PORT;
const io = require("socket.io")(http);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

http.listen(PORT, () => {
  console.log(`Game server on *:${PORT}`);
});
const connections = {};
const mapSockToGame = {};

io.on("connection", (socket) => {
  socket.on("disconnect", () => {});

  socket.on("user-connected", (id) => {
    connections[id] = socket;
    io.emit("user-connect", Object.keys(connections).length);
    connections[id].on("disconnect", async () => {
      delete connections[id];
      io.emit("user-connect", Object.keys(connections).length);
    });
  });

  io.emit("users-connects", Object.keys(connections).length);

  socket.on("user-disconnected", (id) => {
    delete connections[id];
    io.emit("user-connect", Object.keys(connections).length);
  });

  socket.on("new-game", async (gamename) => {
    const receive_name = gamename + "-" + socket.id;
    mapSockToGame[receive_name] = socket;
    const uni_servername =
      "casino_game_server" + (new Date().getTime() / 1000).toString();
    mapSockToGame[receive_name].emit("send-uni", {
      uni_servername,
      receive_name,
    });
  });

  socket.on("uni-name-save", (res) => {
    mapSockToGame[res.game_name].emit("receive-session", res.data);
  });

  socket.on("send-msg", () => {
    io.emit("receive-msg");
  });
});

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // Bind to all network interfaces
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname: "localhost", port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Create Socket.IO server attached to the HTTP server
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"], // Enable both WebSocket and polling
    allowEIO3: true, // Allow Engine.IO v3 clients
    pingTimeout: 60000, // Increase ping timeout for mobile
    pingInterval: 25000, // Adjust ping interval
  });

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);
    console.log("📊 Total clients connected:", io.engine.clientsCount);

    // Log all connected clients
    const clients = Array.from(io.sockets.sockets.keys());
    console.log("👥 Connected client IDs:", clients);

    // Log all events this socket is listening for
    console.log(
      "📡 Socket event listeners:",
      Object.keys(socket.eventNames ? socket.eventNames() : [])
    );

    socket.on("cursor-event", (data) => {
      // Broadcast to all other clients
      socket.broadcast.emit("cursor-event", data);
      console.log("Broadcasting cursor event:", data);
    });

    socket.on("whiteboard-command", (command) => {
      // Broadcast whiteboard commands to all other clients
      console.log("📨 Server received whiteboard command:", command);
      console.log("📨 From socket ID:", socket.id);
      console.log("📨 Total clients:", io.engine.clientsCount);
      console.log("📨 Command type:", typeof command);
      console.log("📨 Command action:", command.action);
      console.log("📨 Command object keys:", Object.keys(command));
      console.log("📨 Command action type:", typeof command.action);

      if (io.engine.clientsCount > 1) {
        console.log(
          "📡 Broadcasting to",
          io.engine.clientsCount - 1,
          "other clients"
        );

        // Get all connected clients
        const allClients = Array.from(io.sockets.sockets.keys());
        const otherClients = allClients.filter((id) => id !== socket.id);
        console.log("📡 Broadcasting to clients:", otherClients);

        // Broadcast command to all other clients
        console.log("📡 Broadcasting command:", JSON.stringify(command));
        socket.broadcast.emit("whiteboard-command", command);
        console.log("✅ Command broadcasted successfully");
      } else {
        console.log("⚠️ No other clients to broadcast to");
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
      console.log("📊 Total clients remaining:", io.engine.clientsCount);
    });
  });

  // Start the server
  server.listen(port, hostname, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Server bound to all network interfaces (0.0.0.0:${port})`);
    console.log("Socket.IO server is running on the same port");

    // Log available network interfaces for mobile connection
    const os = require("os");
    const interfaces = os.networkInterfaces();
    console.log("\n🌐 Available network interfaces for mobile connection:");
    Object.keys(interfaces).forEach((name) => {
      interfaces[name].forEach((interface) => {
        if (interface.family === "IPv4" && !interface.internal) {
          console.log(`  📱 http://${interface.address}:${port}`);
        }
      });
    });
    console.log("\n💡 Use one of the above IP addresses on your mobile device");
  });
});

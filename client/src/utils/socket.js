import { io } from "socket.io-client";

const socket = io("https://YOUR-RENDER-BACKEND.onrender.com", {
  transports: ["websocket"],
});

export default socket;
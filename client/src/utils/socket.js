import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

socket.on("connect", () => {
  console.log("✅ Connected to socket:", socket.id);
});

export default socket;
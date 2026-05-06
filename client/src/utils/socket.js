import { io } from "socket.io-client";

const socket = io("https://cybershield-api.onrender.com", {
  transports: ["websocket"],
});

export default socket;
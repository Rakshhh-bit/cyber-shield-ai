import { io } from "socket.io-client";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5001/api";

const SOCKET_URL = API_URL.replace("/api", "");

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});

export default socket;
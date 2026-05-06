import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["polling", "websocket"],
  withCredentials: true,
});

export const connectSocket = (token = localStorage.getItem("token")) => {
  if (token) {
    socket.auth = { token };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;

import { io } from "socket.io-client";

const backendDomain = import.meta.env.VITE_BACKEND_DOMAIN;

export const socket = io(backendDomain, {
  transports: ["websocket"],
  reconnectionDelayMax: 10000,
});

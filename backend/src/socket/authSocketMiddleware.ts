import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface JwtPayload {
  sub: number;
  email: string;
}

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const authToken = socket.handshake.auth?.token;
    const headerToken = socket.handshake.headers.authorization?.replace("Bearer ", "");
    const token = authToken || headerToken;

    if (!token) {
      return next(new Error("인증 토큰이 없습니다."));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error("JWT_SECRET이 설정되지 않았습니다."));
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    socket.data.user = {
      id: Number(decoded.sub),
      email: decoded.email,
    };

    next();
  } catch (error) {
    next(new Error("유효하지 않은 토큰입니다."));
  }
};
import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const token = authorization.slice("Bearer ".length).trim();
    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);

    if (Number.isNaN(userId)) {
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }

    req.user = {
      id: userId,
      email: payload.email,
    };

    return next();
  } catch (error) {
    console.error("authenticate error:", error);
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};

import { Request, Response } from "express";
import { signupService, loginService } from "../services/authService";

export const signup = async (req: Request, res: Response) => {
  try {
    console.log("signup controller 진입");
    console.log("req.body:", req.body);

    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        message: "email, password, name은 필수입니다.",
      });
    }

    const user = await signupService({ email, password, name });

    console.log("signup service 완료");
    return res.status(201).json(user);
  } catch (error: any) {
    console.error("signup error:", error);
    return res.status(500).json({
      message: error.message || "회원가입 중 서버 오류가 발생했습니다.",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email, password는 필수입니다.",
      });
    }

    const result = await loginService({ email, password });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("login error:", error);
    return res.status(500).json({
      message: error.message || "로그인 중 서버 오류가 발생했습니다.",
    });
  }
};
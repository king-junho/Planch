import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { signAccessToken } from "../utils/jwt";

interface SignupInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const signupService = async ({
  email,
  password,
  name,
}: SignupInput) => {
    console.log("1. 기존 유저 조회 시작");
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  console.log("2. 기존 유저 조회 완료:");
  if (existingUser) {
    throw new Error("이미 사용 중인 이메일입니다.");
  }

  console.log("3. 비밀번호 해싱 시작");
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("4. 비밀번호 해싱 완료");
  console.log("5. 유저 생성 시작");
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });
  console.log("6. 유저 생성 완료");

  return user;
};

export const loginService = async ({
  email,
  password,
}: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const isMatched = await bcrypt.compare(password, user.passwordHash);

  if (!isMatched) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const accessToken = signAccessToken(user.id, user.email);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
};
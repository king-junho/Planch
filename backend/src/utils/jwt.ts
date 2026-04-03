import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET){
    throw new Error("JWT_SECRET이 없습니다. backend/.env 파일을 확인해주세요.");
}

export const signAccessToken = (userId: number,email : string) =>{
    return jwt.sign(
        {sub: userId, email},
        JWT_SECRET,
        {expiresIn: "7d"}
    );
};


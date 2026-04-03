import path from "path";
import express from "express";
import cors from "cors";
import tripRoomRoutes from "./routes/tripRoomRoutes";
import proposalRoutes from "./routes/proposalRoutes";
import authRoutes from "./routes/authRoutes";
import prisma from "./lib/prisma";


const app = express();
const frontendDir = path.resolve(__dirname, "../../frontend");
const corsOrigin = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(",").map((value) => value.trim()) : true,
  }),
);
app.use(express.json());
app.use(express.static(frontendDir));

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: "Database connection failed.",
    });
  }
});

//회원가입, 로그인 routes
app.use("/auth", authRoutes);
//여행방 routes
app.use("/trip-rooms", tripRoomRoutes);
//장소 제안 routes
app.use("/trip-rooms", proposalRoutes);

app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

export default app;

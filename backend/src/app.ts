import path from "path";
import express from "express";
import cors from "cors";
import tripRoomRoutes from "./routes/tripRoomRoutes";
import tripRoomBranchRoutes from "./routes/tripRoomBranchRoutes";
import proposalRoutes from "./routes/proposalRoutes";
import branchRoutes from "./routes/branchRoutes";
import authRoutes from "./routes/authRoutes";
import inviteLinkRoutes from "./routes/inviteLinkRoutes";
import chatRoutes from "./routes/chatRoutes";
import prisma from "./lib/prisma";

const app = express();
const frontendDir = path.resolve(__dirname, "../../frontend");
const corsOrigin = process.env.CORS_ORIGIN;
const uploadDir = path.resolve(__dirname, "../uploads");

app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(",").map((value) => value.trim()) : true,
  }),
);
app.use(express.json());
app.use(express.static(frontendDir));
app.use("/uploads", express.static(uploadDir));

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

app.use("/auth", authRoutes);
app.use("/trip-rooms", tripRoomRoutes);
app.use("/trip-rooms", tripRoomBranchRoutes);
app.use("/trip-rooms", proposalRoutes);
app.use("/invite-links", inviteLinkRoutes);
app.use("/branches", branchRoutes);
app.use("/chat-rooms", chatRoutes);

app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

export default app;

import express from "express";
import cors from "cors";
import tripRoomRoutes from "./routes/tripRoomRoutes";
import proposalRoutes from "./routes/proposalRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/",(_req,res)=>{
    res.send("Planch bckend running");
});

app.use("/trip-rooms",tripRoomRoutes);
app.use("trip-rooms",proposalRoutes);

export default app;
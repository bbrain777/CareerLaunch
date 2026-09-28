import cors from "cors";
import express from "express";
import helmet from "helmet";
import { applicationRouter } from "./routes/applicationRoutes.js";
import { authRouter } from "./routes/auth.js";
import { taskRouter } from "./routes/taskRoutes.js";
import { employerRouter } from "./routes/employerRoutes.js";
import { contactRouter } from "./routes/contactRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { informationalInterviewRouter } from "./routes/informationalInterviewRoutes.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/employers", employerRouter);
app.use("/api/contacts", contactRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/informational-interviews", informationalInterviewRouter);

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "careerlaunch-api"
  });
});

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found" });
});

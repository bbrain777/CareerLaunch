import "./environment.js";

import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { applicationRouter } from "./routes/applicationRoutes.js";
import { authRouter } from "./routes/auth.js";
import { taskRouter } from "./routes/taskRoutes.js";
import { employerRouter } from "./routes/employerRoutes.js";
import { contactRouter } from "./routes/contactRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { informationalInterviewRouter } from "./routes/informationalInterviewRoutes.js";
import { documentRouter } from "./routes/documentRoutes.js";
import { expenseRouter } from "./routes/expenseRoutes.js";
import { careerDocumentRouter } from "./routes/careerDocumentRoutes.js";
import { jobInterviewPreparationRouter } from "./routes/jobInterviewPreparationRoutes.js";
import { corsOptions } from "./cors.js";

export const app = express();

app.use(helmet());

app.use(cors(corsOptions));

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/employers", employerRouter);
app.use("/api/contacts", contactRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/informational-interviews", informationalInterviewRouter);
app.use("/api/documents", documentRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/career-documents", careerDocumentRouter);
app.use("/api/job-interview-preparations", jobInterviewPreparationRouter);

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "careerlaunch-api"
  });
});

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found" });
});

// SECURITY PATCH: Global error handler prevents stack trace leakage to clients
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Server Error]", err);
  res.status(500).json({
    message: "An internal server error occurred"
  });
});

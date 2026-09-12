import cors from "cors";
import express from "express";
import helmet from "helmet";
import { applications, informationalInterviews, upcomingTasks } from "./data.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "careerlaunch-api"
  });
});

app.get("/api/applications", (_request, response) => {
  response.json({ applications });
});

app.get("/api/informational-interviews", (_request, response) => {
  response.json({ informationalInterviews });
});

app.get("/api/dashboard", (_request, response) => {
  const activeStatuses = new Set(["Saved", "Preparing", "Applied", "Interview"]);
  const activeApplications = applications.filter((application) =>
    activeStatuses.has(application.status)
  ).length;
  const interviews = applications.filter(
    (application) => application.status === "Interview"
  ).length;
  const offers = applications.filter(
    (application) => application.status === "Offer"
  ).length;

  response.json({
    metrics: {
      activeApplications,
      interviews,
      offers,
      responseRate: 25
    },
    applications,
    upcomingTasks,
    informationalInterviews
  });
});

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found" });
});

export type ApplicationStatus =
  | "Saved"
  | "Preparing"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Closed";

export interface JobApplication {
  id: number;
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  deadline: string;
  updatedAt: string;
}

export const applications: JobApplication[] = [
  {
    id: 1,
    company: "Northstar Labs",
    position: "Junior Software Engineer",
    location: "London, UK",
    status: "Interview",
    deadline: "2026-09-08",
    updatedAt: "2026-09-03"
  },
  {
    id: 2,
    company: "BrightPath",
    position: "Frontend Developer",
    location: "Remote",
    status: "Applied",
    deadline: "2026-09-11",
    updatedAt: "2026-09-02"
  },
  {
    id: 3,
    company: "Cedar Analytics",
    position: "Graduate Data Analyst",
    location: "Manchester, UK",
    status: "Preparing",
    deadline: "2026-09-13",
    updatedAt: "2026-09-01"
  },
  {
    id: 4,
    company: "Horizon Health",
    position: "Web Application Intern",
    location: "Birmingham, UK",
    status: "Saved",
    deadline: "2026-09-18",
    updatedAt: "2026-08-31"
  }
];

export const upcomingTasks = [
  {
    id: 1,
    title: "Prepare for Northstar Labs interview",
    due: "Tomorrow, 10:00 AM",
    type: "Interview"
  },
  {
    id: 2,
    title: "Follow up with BrightPath recruiter",
    due: "September 7",
    type: "Follow-up"
  },
  {
    id: 3,
    title: "Tailor resume for Cedar Analytics",
    due: "September 9",
    type: "Document"
  }
];

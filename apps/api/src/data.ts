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

export interface InformationalInterview {
  id: number;
  contactName: string;
  role: string;
  company: string;
  scheduledFor: string;
  status: "Preparing" | "Scheduled" | "Completed";
  preparationQuestions: string[];
  keyTakeaway?: string;
  recommendedAction?: string;
  referral?: string;
  thankYouSent: boolean;
  nextFollowUp?: string;
}

export const applications: JobApplication[] = [
  {
    id: 1,
    company: "Northstar Labs",
    position: "Junior Software Engineer",
    location: "London, UK",
    status: "Interview",
    deadline: "2026-09-14",
    updatedAt: "2026-09-12"
  },
  {
    id: 2,
    company: "BrightPath",
    position: "Frontend Developer",
    location: "Remote",
    status: "Applied",
    deadline: "2026-09-16",
    updatedAt: "2026-09-11"
  },
  {
    id: 3,
    company: "Cedar Analytics",
    position: "Graduate Data Analyst",
    location: "Manchester, UK",
    status: "Preparing",
    deadline: "2026-09-18",
    updatedAt: "2026-09-10"
  },
  {
    id: 4,
    company: "Horizon Health",
    position: "Web Application Intern",
    location: "Birmingham, UK",
    status: "Saved",
    deadline: "2026-09-22",
    updatedAt: "2026-09-09"
  }
];

export const upcomingTasks = [
  {
    id: 1,
    title: "Prepare for Northstar Labs interview",
    due: "September 13, 10:00 AM",
    type: "Interview"
  },
  {
    id: 2,
    title: "Follow up with BrightPath recruiter",
    due: "September 14",
    type: "Follow-up"
  },
  {
    id: 3,
    title: "Tailor resume for Cedar Analytics",
    due: "September 15",
    type: "Document"
  }
];

export const informationalInterviews: InformationalInterview[] = [
  {
    id: 1,
    contactName: "Maya Thompson",
    role: "Senior Software Engineer",
    company: "Northstar Labs",
    scheduledFor: "2026-09-16T14:00:00+01:00",
    status: "Scheduled",
    preparationQuestions: [
      "Which skills matter most for an early-career engineer on your team?",
      "What helped you move into your current role?",
      "Which course, book, or technology would you recommend learning next?"
    ],
    recommendedAction: "Review Northstar Labs' engineering blog before the meeting.",
    thankYouSent: false,
    nextFollowUp: "2026-09-17"
  },
  {
    id: 2,
    contactName: "Daniel Okoro",
    role: "Product Analyst",
    company: "Cedar Analytics",
    scheduledFor: "2026-09-09T16:30:00+01:00",
    status: "Completed",
    preparationQuestions: [
      "How does your team measure success for graduate analysts?",
      "What portfolio projects best demonstrate readiness for the role?"
    ],
    keyTakeaway: "Show business impact alongside technical analysis in portfolio projects.",
    recommendedAction: "Add a short outcomes section to the analytics portfolio case study.",
    referral: "Priya Shah, Graduate Recruitment Lead",
    thankYouSent: true,
    nextFollowUp: "2026-09-23"
  }
];

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

export interface UpcomingTask {
  id: number;
  title: string;
  due: string;
  type: string;
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

export interface DashboardData {
  metrics: {
    activeApplications: number;
    interviews: number;
    offers: number;
    responseRate: number;
  };
  applications: JobApplication[];
  upcomingTasks: UpcomingTask[];
  informationalInterviews: InformationalInterview[];
}

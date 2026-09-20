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
  location: string | null;
  status: ApplicationStatus;
  deadline: string | null;
  appliedAt?: string | null;
  notes?: string | null;
  employerId?: number | null;
  contactId?: number | null;
  updatedAt?: string;
}

export interface ApplicationInput {
  company: string;
  position: string;
  location?: string | null;
  status?: ApplicationStatus;
  deadline?: string | null;
  appliedAt?: string | null;
  notes?: string | null;
  employerId?: number | null;
  contactId?: number | null;
}

export interface UpcomingTask {
  id: number;
  title: string;
  description?: string | null;
  due: string | null;
  type: string;
  status?: "Pending" | "Completed";
  applicationId?: number | null;
  contactId?: number | null;
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

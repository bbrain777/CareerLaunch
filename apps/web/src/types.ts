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

export interface Employer {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  notes: string | null;
  userId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployerInput {
  name: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  notes: string | null;
  lastContacted: string | null;
  nextFollowUp: string | null;
  employerId: number | null;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactInput {
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  notes?: string | null;
  lastContacted?: string | null;
  nextFollowUp?: string | null;
  employerId?: number | null;
}

export interface UpcomingTask {
  id: number | string;
  title: string;
  description?: string | null;
  due: string | null;
  type: string;
  status?: "Pending" | "Completed";
  href?: "/applications" | "/contacts" | "/informational-interviews";
  overdue?: boolean;
  priority?: "Overdue" | "Soon" | "Upcoming" | "No date";
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
  keyTakeaway?: string | null;
  recommendedAction?: string | null;
  referral?: string | null;
  thankYouSent: boolean;
  nextFollowUp?: string | null;
  contactId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InformationalInterviewInput {
  contactName: string;
  role: string;
  company?: string | null;
  scheduledFor: string;
  status?: "Preparing" | "Scheduled" | "Completed";
  preparationQuestions?: string[];
  keyTakeaway?: string | null;
  recommendedAction?: string | null;
  referral?: string | null;
  thankYouSent?: boolean;
  nextFollowUp?: string | null;
  contactId?: number | null;
}

export interface CareerDocument {
  id: number;
  type: "RESUME" | "COVER_LETTER";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string;
}

export interface DashboardData {
  metrics: {
    activeApplications: number;
    interviews: number;
    offers: number;
    responseRate: number;
  };
  statusSummary: Array<{
    status: string;
    count: number;
  }>;
  reminderSummary: {
    total: number;
    overdue: number;
    dueThisWeek: number;
  };
  applications: JobApplication[];
  upcomingTasks: UpcomingTask[];
  informationalInterviews: InformationalInterview[];
}

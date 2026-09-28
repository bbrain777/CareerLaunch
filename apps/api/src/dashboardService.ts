import type { InformationalInterview } from "./data.js";

const activeStatuses = new Set(["SAVED", "PREPARING", "APPLIED", "INTERVIEW"]);
const submittedStatuses = new Set(["APPLIED", "INTERVIEW", "OFFER", "CLOSED"]);
const responseStatuses = new Set(["INTERVIEW", "OFFER", "CLOSED"]);

const clientStatusByDatabaseStatus: Record<string, string> = {
  SAVED: "Saved",
  PREPARING: "Preparing",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  CLOSED: "Closed",
};

type DashboardRecord = Record<string, any>;

export interface DashboardReminder {
  id: string;
  title: string;
  description: string | null;
  due: string | null;
  type: "Deadline" | "Recruiter" | "Contact" | "Thank-you" | "Interview" | "Action item";
  status: "Pending" | "Completed";
  href: "/applications" | "/contacts" | "/informational-interviews";
  overdue: boolean;
  priority: "Overdue" | "Soon" | "Upcoming" | "No date";
  applicationId?: number | null;
  contactId?: number | null;
}

function normalizedStatus(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function dateOnly(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const serialized = value instanceof Date ? value.toISOString() : String(value);
  return serialized.slice(0, 10);
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function reminderTiming(due: string | null, today: Date) {
  if (!due) return { overdue: false, priority: "No date" as const };

  const dueDate = new Date(`${due}T00:00:00Z`);
  const start = startOfUtcDay(today);
  const daysAway = Math.floor((dueDate.getTime() - start.getTime()) / 86_400_000);

  if (daysAway < 0) return { overdue: true, priority: "Overdue" as const };
  if (daysAway <= 7) return { overdue: false, priority: "Soon" as const };
  return { overdue: false, priority: "Upcoming" as const };
}

function contactName(contact: DashboardRecord): string {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || "contact";
}

function isRecruiter(contact: DashboardRecord): boolean {
  return /recruit|talent|hiring/i.test(String(contact.jobTitle ?? ""));
}

function isPendingTask(task: DashboardRecord): boolean {
  return normalizedStatus(task.status) !== "COMPLETED";
}

function taskReminder(task: DashboardRecord, today: Date): DashboardReminder {
  const titleAndDescription = `${task.title ?? ""} ${task.description ?? ""}`;
  const thankYou = /thank[ -]?you/i.test(titleAndDescription);
  const due = dateOnly(task.dueDate ?? task.due);
  const timing = reminderTiming(due, today);
  const type = thankYou
    ? "Thank-you"
    : task.contactId
      ? "Contact"
      : "Action item";
  const href = task.contactId
    ? "/contacts"
    : task.applicationId
      ? "/applications"
      : "/applications";

  return {
    id: `task-${task.id}`,
    title: String(task.title),
    description: task.description ? String(task.description) : null,
    due,
    type,
    status: "Pending",
    href,
    ...timing,
    applicationId: task.applicationId ? Number(task.applicationId) : null,
    contactId: task.contactId ? Number(task.contactId) : null,
  };
}

function applicationReminder(application: DashboardRecord, today: Date): DashboardReminder | null {
  const due = dateOnly(application.deadline);
  if (!due || normalizedStatus(application.status) === "CLOSED") return null;
  const company = String(application.company || "application");

  return {
    id: `application-${application.id}-deadline`,
    title: `${company} deadline`,
    description: application.position ? String(application.position) : null,
    due,
    type: "Deadline",
    status: "Pending",
    href: "/applications",
    ...reminderTiming(due, today),
    applicationId: Number(application.id),
    contactId: application.contactId ? Number(application.contactId) : null,
  };
}

function contactReminder(contact: DashboardRecord, today: Date): DashboardReminder | null {
  const due = dateOnly(contact.nextFollowUp);
  if (!due) return null;
  const recruiter = isRecruiter(contact);

  return {
    id: `contact-${contact.id}-follow-up`,
    title: `Follow up with ${contactName(contact)}`,
    description: contact.jobTitle ? String(contact.jobTitle) : null,
    due,
    type: recruiter ? "Recruiter" : "Contact",
    status: "Pending",
    href: "/contacts",
    ...reminderTiming(due, today),
    applicationId: null,
    contactId: Number(contact.id),
  };
}

function interviewReminders(
  interview: InformationalInterview,
  today: Date,
): DashboardReminder[] {
  const reminders: DashboardReminder[] = [];
  const interviewDate = dateOnly(interview.scheduledFor);

  if (interview.status !== "Completed") {
    reminders.push({
      id: `interview-${interview.id}-prepare`,
      title: `Prepare for conversation with ${interview.contactName}`,
      description: [interview.role, interview.company].filter(Boolean).join(" at "),
      due: interviewDate,
      type: "Interview",
      status: "Pending",
      href: "/informational-interviews",
      ...reminderTiming(interviewDate, today),
    });
  }

  if (interview.status === "Completed" && !interview.thankYouSent) {
    reminders.push({
      id: `interview-${interview.id}-thank-you`,
      title: `Send thank-you to ${interview.contactName}`,
      description: interview.company || interview.role || null,
      due: interviewDate,
      type: "Thank-you",
      status: "Pending",
      href: "/informational-interviews",
      ...reminderTiming(interviewDate, today),
    });
  }

  if (interview.nextFollowUp) {
    const due = dateOnly(interview.nextFollowUp);
    reminders.push({
      id: `interview-${interview.id}-follow-up`,
      title: `Reconnect with ${interview.contactName}`,
      description: interview.recommendedAction || null,
      due,
      type: "Contact",
      status: "Pending",
      href: "/informational-interviews",
      ...reminderTiming(due, today),
    });
  }

  return reminders;
}

function serializeApplication(application: DashboardRecord) {
  const status = normalizedStatus(application.status);
  return {
    ...application,
    id: Number(application.id),
    status: clientStatusByDatabaseStatus[status] ?? application.status,
    deadline: dateOnly(application.deadline),
    appliedAt: dateOnly(application.appliedAt),
    createdAt: application.createdAt ? String(application.createdAt) : undefined,
    updatedAt: application.updatedAt ? String(application.updatedAt) : undefined,
  };
}

function sortReminders(reminders: DashboardReminder[]) {
  const priorityRank = { Overdue: 0, Soon: 1, Upcoming: 2, "No date": 3 };
  return reminders.sort((left, right) => {
    const priorityDifference = priorityRank[left.priority] - priorityRank[right.priority];
    if (priorityDifference) return priorityDifference;
    return (left.due ?? "9999-12-31").localeCompare(right.due ?? "9999-12-31");
  });
}

export function buildDashboardData({
  applications,
  contacts,
  tasks,
  informationalInterviews,
  today = new Date(),
}: {
  applications: DashboardRecord[];
  contacts: DashboardRecord[];
  tasks: DashboardRecord[];
  informationalInterviews: InformationalInterview[];
  today?: Date;
}) {
  const statuses = applications.map((application) => normalizedStatus(application.status));
  const submittedApplications = statuses.filter((status) => submittedStatuses.has(status)).length;
  const respondedApplications = statuses.filter((status) => responseStatuses.has(status)).length;

  const reminders = sortReminders([
    ...tasks.filter(isPendingTask).map((task) => taskReminder(task, today)),
    ...applications
      .map((application) => applicationReminder(application, today))
      .filter((reminder): reminder is DashboardReminder => Boolean(reminder)),
    ...contacts
      .map((contact) => contactReminder(contact, today))
      .filter((reminder): reminder is DashboardReminder => Boolean(reminder)),
    ...informationalInterviews.flatMap((interview) => interviewReminders(interview, today)),
  ]);

  const todayStart = startOfUtcDay(today).getTime();
  const inSevenDays = todayStart + 7 * 86_400_000;
  const dueThisWeek = reminders.filter((reminder) => {
    if (!reminder.due) return false;
    const due = new Date(`${reminder.due}T00:00:00Z`).getTime();
    return due >= todayStart && due <= inSevenDays;
  }).length;

  return {
    metrics: {
      activeApplications: statuses.filter((status) => activeStatuses.has(status)).length,
      interviews: statuses.filter((status) => status === "INTERVIEW").length,
      offers: statuses.filter((status) => status === "OFFER").length,
      responseRate: submittedApplications
        ? Math.round((respondedApplications / submittedApplications) * 100)
        : 0,
    },
    statusSummary: Object.entries(clientStatusByDatabaseStatus).map(([status, label]) => ({
      status: label,
      count: statuses.filter((value) => value === status).length,
    })),
    reminderSummary: {
      total: reminders.length,
      overdue: reminders.filter((reminder) => reminder.overdue).length,
      dueThisWeek,
    },
    applications: applications.map(serializeApplication),
    upcomingTasks: reminders,
    informationalInterviews,
  };
}

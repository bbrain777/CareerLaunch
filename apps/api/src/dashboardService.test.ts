import { describe, expect, it } from "vitest";
import { buildDashboardData } from "./dashboardService.js";

describe("dashboard aggregation", () => {
  it("calculates live metrics and orders coordinated reminders by urgency", () => {
    const dashboard = buildDashboardData({
      today: new Date("2026-09-28T12:00:00Z"),
      applications: [
        {
          id: 1,
          company: "Past Due Ltd",
          position: "Engineer",
          status: "APPLIED",
          deadline: "2026-09-27T00:00:00Z",
        },
        {
          id: 2,
          company: "Interview Co",
          position: "Analyst",
          status: "INTERVIEW",
          deadline: null,
        },
        {
          id: 3,
          company: "Offer Co",
          position: "Developer",
          status: "OFFER",
          deadline: null,
        },
      ],
      contacts: [
        {
          id: 4,
          firstName: "Amina",
          lastName: "Cole",
          jobTitle: "Talent Partner",
          nextFollowUp: "2026-09-30T00:00:00Z",
        },
      ],
      tasks: [
        {
          id: 5,
          title: "Finish portfolio action item",
          dueDate: null,
          status: "PENDING",
        },
        {
          id: 6,
          title: "Completed task",
          dueDate: "2026-09-28T00:00:00Z",
          status: "COMPLETED",
        },
      ],
      informationalInterviews: [
        {
          id: 7,
          contactName: "Jordan Lee",
          role: "Designer",
          company: "Studio",
          scheduledFor: "2026-09-26T14:00:00Z",
          status: "Completed",
          preparationQuestions: [],
          thankYouSent: false,
        },
      ],
    });

    expect(dashboard.metrics).toEqual({
      activeApplications: 2,
      interviews: 1,
      offers: 1,
      responseRate: 67,
    });
    expect(dashboard.reminderSummary).toEqual({ total: 4, overdue: 2, dueThisWeek: 1 });
    expect(dashboard.upcomingTasks.map((reminder) => reminder.id)).toEqual([
      "interview-7-thank-you",
      "application-1-deadline",
      "contact-4-follow-up",
      "task-5",
    ]);
    expect(dashboard.upcomingTasks[2]).toMatchObject({
      type: "Recruiter",
      priority: "Soon",
      href: "/contacts",
    });
  });

  // --- NEW SPRINT 3 SECURITY TEST BELOW ---
  
  it("handles missing dates and closed statuses gracefully without failing", () => {
    const dashboard = buildDashboardData({
      today: new Date("2026-09-28T12:00:00Z"),
      applications: [{ id: 1, status: "CLOSED", deadline: "2026-10-10T00:00:00Z" }],
      tasks: [{ id: 2, status: "PENDING", title: "No date task", dueDate: null }],
      contacts: [{ id: 3, nextFollowUp: null }],
      informationalInterviews: [{ 
        id: 4, 
        status: "COMPLETED", 
        thankYouSent: true, 
        nextFollowUp: null 
      }],
    } as any);

    // Closed applications should not generate deadline reminders
    expect(dashboard.upcomingTasks.find(t => t.type === "Deadline")).toBeUndefined();
    
    // Tasks without dates should safely default to "No date" priority
    expect(dashboard.upcomingTasks.find(t => t.id === "task-2")?.priority).toBe("No date");
    
    // Contacts and Interviews without follow-up dates should be safely ignored
    expect(dashboard.upcomingTasks.find(t => t.type === "Contact")).toBeUndefined();
  });
});
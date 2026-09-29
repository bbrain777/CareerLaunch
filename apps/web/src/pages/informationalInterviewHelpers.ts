import type { InformationalInterview, UpcomingTask } from "../types";

export const PREP_QUESTION_MIN = 3;
export const PREP_QUESTION_MAX = 5;

export function parsePreparationQuestions(text: string): string[] {
  return text
    .split("\n")
    .map((question) => question.trim())
    .filter(Boolean);
}

export function validatePreparationQuestions(questions: string[]): string | null {
  if (questions.length < PREP_QUESTION_MIN) {
    return `Add at least ${PREP_QUESTION_MIN} preparation questions (${questions.length} added).`;
  }
  if (questions.length > PREP_QUESTION_MAX) {
    return `Keep preparation questions to ${PREP_QUESTION_MAX} or fewer (${questions.length} added).`;
  }
  return null;
}

export function filterInterviews(
  interviews: InformationalInterview[],
  query: string,
  companyFilter: string,
): InformationalInterview[] {
  let result = interviews;
  if (companyFilter !== "All") {
    result = result.filter((interview) => interview.company === companyFilter);
  }
  const search = query.trim().toLowerCase();
  if (search) {
    result = result.filter((interview) =>
      [
        interview.contactName,
        interview.company,
        interview.role,
        interview.status,
        interview.keyTakeaway,
        interview.scheduledFor,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }
  return result;
}

export function selectInterviewReminders(tasks: UpcomingTask[]): UpcomingTask[] {
  return tasks.filter((task) => task.href === "/informational-interviews");
}

export interface InterviewReadinessSummary {
  total: number;
  preparing: number;
  scheduled: number;
  completed: number;
  thankYouPending: number;
  followUps: number;
  preparationQuestionCount: number;
}

export function getInterviewReadinessSummary(
  interviews: InformationalInterview[],
): InterviewReadinessSummary {
  return {
    total: interviews.length,
    preparing: interviews.filter((interview) => interview.status === "Preparing").length,
    scheduled: interviews.filter((interview) => interview.status === "Scheduled").length,
    completed: interviews.filter((interview) => interview.status === "Completed").length,
    thankYouPending: interviews.filter(
      (interview) => interview.status === "Completed" && !interview.thankYouSent,
    ).length,
    followUps: interviews.filter((interview) => Boolean(interview.nextFollowUp)).length,
    preparationQuestionCount: interviews.reduce(
      (total, interview) => total + (interview.preparationQuestions?.length ?? 0),
      0,
    ),
  };
}

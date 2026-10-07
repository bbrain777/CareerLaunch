import { Temporal } from "temporal-polyfill";
import { getDb } from "./db.js";

const TARGET_EMAIL = process.env.SEED_USER_EMAIL?.trim().toLowerCase();

function instant(value: string) {
  return Temporal.Instant.from(value);
}

async function main() {
  if (!TARGET_EMAIL) {
    throw new Error("SEED_USER_EMAIL is required and must identify an existing account.");
  }

  const db = getDb();
  const user = await db.orm.public.User.where({ email: TARGET_EMAIL }).first();

  if (!user) {
    throw new Error(`Production user ${TARGET_EMAIL} was not found.`);
  }

  const userId = Number(user.id);

  const existingRecords = await Promise.all([
    db.orm.public.Employer.where({ userId }).all(),
    db.orm.public.Contact.where({ userId }).all(),
    db.orm.public.Application.where({ userId }).all(),
    db.orm.public.Task.where({ userId }).all(),
    db.orm.public.InformationalInterview.where({ userId }).all(),
  ]);

  if (existingRecords.some((records) => records.length > 0)) {
    throw new Error("Seed stopped because this account already contains application data.");
  }

  await db.orm.public.User.where({ id: userId }).update({
    firstName: "Olakunle",
    lastName: "Obademi",
    currentRole: "Computer Science Student",
    targetRole: "Software Engineer",
    weeklyGoal: 5,
  });

  const byteBridge = await db.orm.public.Employer.create({
    userId,
    name: "ByteBridge Software",
    website: "https://example.com/bytebridge",
    industry: "Software Development",
    location: "London, UK",
    notes: "Graduate-friendly product engineering company used for the CareerLaunch demonstration.",
  });

  const greenfield = await db.orm.public.Employer.create({
    userId,
    name: "Greenfield Analytics",
    website: "https://example.com/greenfield",
    industry: "Data and Analytics",
    location: "Manchester, UK",
    notes: "Data platform company with a structured graduate engineering programme.",
  });

  const northstar = await db.orm.public.Employer.create({
    userId,
    name: "Northstar Health Tech",
    website: "https://example.com/northstar",
    industry: "Healthcare Technology",
    location: "Remote, UK",
    notes: "Health technology organisation offering flexible early-career roles.",
  });

  const horizon = await db.orm.public.Employer.create({
    userId,
    name: "Horizon Cloud Services",
    website: "https://example.com/horizon-cloud",
    industry: "Cloud Computing",
    location: "Birmingham, UK",
    notes: "Cloud consultancy with mentoring and certification support.",
  });

  const amelia = await db.orm.public.Contact.create({
    userId,
    employerId: byteBridge.id,
    firstName: "Amelia",
    lastName: "Hart",
    email: "amelia.hart@example.com",
    jobTitle: "Graduate Recruiter",
    lastContacted: instant("2026-10-03T10:00:00Z"),
    nextFollowUp: instant("2026-10-10T09:00:00Z"),
    notes: "Met during an online graduate careers event; follow up after the application review window.",
  });

  const daniel = await db.orm.public.Contact.create({
    userId,
    employerId: greenfield.id,
    firstName: "Daniel",
    lastName: "Reed",
    email: "daniel.reed@example.com",
    jobTitle: "Senior Backend Engineer",
    lastContacted: instant("2026-10-05T14:30:00Z"),
    nextFollowUp: instant("2026-10-12T09:00:00Z"),
    notes: "Shared interview preparation advice and information about the engineering team.",
  });

  const priya = await db.orm.public.Contact.create({
    userId,
    employerId: northstar.id,
    firstName: "Priya",
    lastName: "Shah",
    email: "priya.shah@example.com",
    jobTitle: "Software Engineering Manager",
    lastContacted: instant("2026-10-01T16:00:00Z"),
    nextFollowUp: instant("2026-10-15T09:00:00Z"),
    notes: "Professional contact for learning about healthcare software engineering careers.",
  });

  const byteBridgeApplication = await db.orm.public.Application.create({
    userId,
    employerId: byteBridge.id,
    contactId: amelia.id,
    company: "ByteBridge Software",
    position: "Junior Full-Stack Developer",
    location: "London, UK",
    status: "APPLIED",
    appliedAt: instant("2026-10-03T09:00:00Z"),
    deadline: instant("2026-10-01T23:59:00Z"),
    notes: "Submitted a tailored CV and cover letter through the graduate careers portal.",
  });

  const greenfieldApplication = await db.orm.public.Application.create({
    userId,
    employerId: greenfield.id,
    contactId: daniel.id,
    company: "Greenfield Analytics",
    position: "Graduate Backend Engineer",
    location: "Manchester, UK",
    status: "INTERVIEW",
    appliedAt: instant("2026-09-25T09:00:00Z"),
    deadline: instant("2026-09-30T23:59:00Z"),
    notes: "Technical interview scheduled; review REST API design, SQL, and teamwork examples.",
  });

  const northstarApplication = await db.orm.public.Application.create({
    userId,
    employerId: northstar.id,
    contactId: priya.id,
    company: "Northstar Health Tech",
    position: "Software Engineering Intern",
    location: "Remote, UK",
    status: "PREPARING",
    deadline: instant("2026-10-12T23:59:00Z"),
    notes: "Tailor the portfolio to accessibility, data privacy, and user-centred development.",
  });

  await db.orm.public.Application.create({
    userId,
    employerId: horizon.id,
    company: "Horizon Cloud Services",
    position: "Junior Cloud Engineer",
    location: "Birmingham, UK",
    status: "OFFER",
    appliedAt: instant("2026-09-15T09:00:00Z"),
    deadline: instant("2026-09-18T23:59:00Z"),
    notes: "Offer received; compare mentoring, certification support, start date, and total compensation.",
  });

  await db.orm.public.Application.create({
    userId,
    company: "Civic Digital UK",
    position: "Junior Web Developer",
    location: "Leeds, UK",
    status: "SAVED",
    deadline: instant("2026-10-18T23:59:00Z"),
    notes: "Saved for review; research the organisation and tailor project examples before applying.",
  });

  await db.orm.public.InformationalInterview.create({
    userId,
    contactId: daniel.id,
    contactName: "Daniel Reed",
    role: "Senior Backend Engineer",
    company: "Greenfield Analytics",
    scheduledFor: instant("2026-10-09T14:00:00Z"),
    status: "SCHEDULED",
    preparationQuestions: [
      "Which backend skills make graduate candidates stand out on your team?",
      "How does the team review code and support junior engineers?",
      "What should I expect during the technical interview?",
    ],
    recommendedAction: "Review Greenfield's technology stack and prepare two concise project examples.",
    thankYouSent: false,
    nextFollowUp: instant("2026-10-10T09:00:00Z"),
  });

  await db.orm.public.InformationalInterview.create({
    userId,
    contactId: priya.id,
    contactName: "Priya Shah",
    role: "Software Engineering Manager",
    company: "Northstar Health Tech",
    scheduledFor: instant("2026-10-01T16:00:00Z"),
    status: "COMPLETED",
    preparationQuestions: [
      "How do engineers collaborate with clinical and product teams?",
      "Which accessibility practices are most important in health technology?",
      "What learning path would you recommend for an early-career engineer?",
    ],
    recommendedAction: "Send a thank-you message and apply the accessibility advice to the portfolio.",
    thankYouSent: true,
    nextFollowUp: instant("2026-10-15T09:00:00Z"),
  });

  await db.orm.public.Task.create({
    userId,
    applicationId: greenfieldApplication.id,
    contactId: daniel.id,
    title: "Prepare for Greenfield technical interview",
    description: "Practise API design, PostgreSQL queries, and STAR examples from the CareerLaunch project.",
    dueDate: instant("2026-10-08T18:00:00Z"),
    status: "PENDING",
  });

  await db.orm.public.Task.create({
    userId,
    applicationId: byteBridgeApplication.id,
    contactId: amelia.id,
    title: "Follow up with ByteBridge recruiter",
    description: "Send a concise follow-up confirming continued interest in the full-stack role.",
    dueDate: instant("2026-10-10T09:00:00Z"),
    status: "PENDING",
  });

  await db.orm.public.Task.create({
    userId,
    applicationId: northstarApplication.id,
    contactId: priya.id,
    title: "Complete Northstar application materials",
    description: "Tailor the CV and cover letter and check them against the role requirements.",
    dueDate: instant("2026-10-11T18:00:00Z"),
    status: "PENDING",
  });

  await db.orm.public.Task.create({
    userId,
    title: "Update GitHub portfolio README",
    description: "Add CareerLaunch architecture, testing, deployment, and production screenshots.",
    dueDate: instant("2026-10-13T18:00:00Z"),
    status: "PENDING",
  });

  console.log(JSON.stringify({
    seededUserId: userId,
    employers: 4,
    contacts: 3,
    applications: 5,
    informationalInterviews: 2,
    tasks: 4,
  }));
}

main().catch((error) => {
  console.error("Production demo seed failed:", error);
  process.exit(1);
});

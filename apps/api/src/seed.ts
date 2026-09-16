import { Temporal } from "temporal-polyfill";
import { db } from "./db.js";

async function main() {
    console.log("Seeding CareerLaunch database...");

    // Clear existing seed data so the script can be safely run again.
    await db.orm.public.Task.where({}).deleteAll();
    await db.orm.public.Application.where({}).deleteAll();
    await db.orm.public.Contact.where({}).deleteAll();
    await db.orm.public.Employer.where({}).deleteAll();
    await db.orm.public.User.where({}).deleteAll();

    // Users
    const saleh = await db.orm.public.User.create({
        email: "saleh@example.com",
        passwordHash: "seed-password-hash",
        firstName: "Saleh",
        lastName: "Ntege",
        role: "STUDENT",
    });

    const student = await db.orm.public.User.create({
        email: "student@example.com",
        passwordHash: "seed-password-hash",
        firstName: "John",
        lastName: "Doe",
        role: "STUDENT",
    });

    // Employers
    const techCorp = await db.orm.public.Employer.create({
        name: "TechCorp Uganda",
        website: "https://example.com",
        industry: "Technology",
        location: "Kampala, Uganda",
        notes: "Software development and technology services company.",
    });

    const brightPath = await db.orm.public.Employer.create({
        name: "BrightPath Solutions",
        industry: "Information Technology",
        location: "Kampala, Uganda",
        notes: "Technology and business solutions provider.",
    });

    const horizon = await db.orm.public.Employer.create({
        name: "Horizon Health",
        industry: "Healthcare Technology",
        location: "Kampala, Uganda",
        notes: "Healthcare technology organization.",
    });

    // Professional contacts
    const recruiter = await db.orm.public.Contact.create({
        firstName: "Sarah",
        lastName: "Nakato",
        email: "sarah@example.com",
        jobTitle: "Recruiter",
        userId: saleh.id,
        employerId: techCorp.id,
        notes: "Recruiter contacted through a career networking event.",
        nextFollowUp: Temporal.Instant.from("2026-09-25T00:00:00Z"),
    });

    const engineer = await db.orm.public.Contact.create({
        firstName: "David",
        lastName: "Okello",
        email: "david@example.com",
        jobTitle: "Software Engineer",
        userId: saleh.id,
        employerId: brightPath.id,
        notes: "Professional contact for an informational interview.",
        nextFollowUp: Temporal.Instant.from("2026-09-25T00:00:00Z"),
    });

    // Applications
    const application1 = await db.orm.public.Application.create({
        company: "TechCorp Uganda",
        position: "Junior Software Developer",
        location: "Kampala, Uganda",
        status: "APPLIED",
        deadline: Temporal.Instant.from("2026-09-30T00:00:00Z"),
        appliedAt: Temporal.Instant.from("2026-09-25T00:00:00Z"),
        notes: "Submitted application through company careers page.",
        userId: saleh.id,
        employerId: techCorp.id,
        contactId: recruiter.id,
    });

    const application2 = await db.orm.public.Application.create({
        company: "BrightPath Solutions",
        position: "Backend Developer",
        location: "Kampala, Uganda",
        status: "INTERVIEW",
        deadline: Temporal.Instant.from("2026-09-25T00:00:00Z"),
        appliedAt: Temporal.Instant.from("2026-09-25T00:00:00Z"),
        notes: "Interview scheduled with the engineering team.",
        userId: saleh.id,
        employerId: brightPath.id,
        contactId: engineer.id,
    });

    const application3 = await db.orm.public.Application.create({
        company: "Horizon Health",
        position: "Software Developer Intern",
        location: "Kampala, Uganda",
        status: "PREPARING",
        deadline: Temporal.Instant.from("2026-09-25T00:00:00Z"),
        notes: "Preparing application materials.",
        userId: saleh.id,
        employerId: horizon.id,
    });

    await db.orm.public.Application.create({
        company: "Digital Uganda",
        position: "Web Developer",
        location: "Kampala, Uganda",
        status: "SAVED",
        deadline: Temporal.Instant.from("2026-09-25T00:00:00Z"),
        notes: "Interesting opportunity to review before applying.",
        userId: saleh.id,
    });

    // Tasks
    await db.orm.public.Task.create({
        title: "Prepare for BrightPath interview",
        description:
            "Review technical questions and prepare examples of previous projects.",
        dueDate: Temporal.Instant.from("2026-09-25T00:00:00Z"),
        status: "PENDING",
        userId: saleh.id,
        applicationId: application2.id,
    });

    await db.orm.public.Task.create({
        title: "Follow up with TechCorp recruiter",
        description:
            "Send a professional follow-up message regarding the application.",


        dueDate: Temporal.Instant.from("2026-09-25T00:00:00Z"),
        status: "PENDING",
        userId: saleh.id,
        applicationId: application1.id,
        contactId: recruiter.id,
    });

    await db.orm.public.Task.create({
        title: "Complete Horizon Health application",
        description:
            "Finish resume and cover letter before the application deadline.",
        dueDate: Temporal.Instant.from("2026-09-25T00:00:00Z"),
        status: "PENDING",
        userId: saleh.id,
        applicationId: application3.id,
    });

    await db.orm.public.Task.create({
        title: "Update career profile",
        description:
            "Review professional profile and update recent projects.",
        dueDate: Temporal.Instant.from("2026-09-25T00:00:00Z"),
        status: "COMPLETED",
        userId: saleh.id,
    });

    console.log("CareerLaunch database seeded successfully.");
}

main().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
});
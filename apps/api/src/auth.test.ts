import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("Authentication API", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123"
  };

  let authToken = "";

  it("registers a new user successfully", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Registration successful");
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(testUser.email);
  });

  it("rejects registration if user already exists", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User already exists");
  });

  it("logs in successfully and returns a token", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBeDefined();

    // Save the generated token to test the protected route
    authToken = response.body.token;
  });

  it("rejects login with incorrect password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "wrongpassword"
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  it("accesses protected profile route with valid token", async () => {
    const response = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Profile accessed successfully");
    expect(response.body.user.email).toBe(testUser.email);
  });

  it("rejects access to protected route without a token", async () => {
    const response = await request(app).get("/api/auth/profile");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized: No token provided");
  });

  it("logs out successfully", async () => {
    const response = await request(app).post("/api/auth/logout");
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Logout successful");
  });
});
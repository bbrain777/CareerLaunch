import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { DashboardData, JobApplication, InformationalInterview } from "../types";
import type { AuthUser } from "../lib/auth";

// --- Query Keys ---
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  applications: ["applications"] as const,
  interviews: ["interviews"] as const,
  profile: ["profile"] as const,
};

// --- Queries ---

/**
 * Fetch dashboard metrics, upcoming tasks, and recent pipelines
 */
export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.get<DashboardData>("/api/dashboard"),
  });
}

/**
 * Fetch all job applications
 */
export function useApplicationsQuery() {
  return useQuery({
    queryKey: queryKeys.applications,
    queryFn: async () => {
      const result = await api.get<any>("/api/applications");
      return (
        Array.isArray(result)
          ? result
          : Array.isArray(result?.applications)
          ? result.applications
          : []
      ) as JobApplication[];
    },
  });
}

/**
 * Fetch all informational interviews
 */
export function useInterviewsQuery() {
  return useQuery({
    queryKey: queryKeys.interviews,
    queryFn: async () => {
      const result = await api.get<any>("/api/informational-interviews");
      return (
        Array.isArray(result)
          ? result
          : Array.isArray(result?.informationalInterviews)
          ? result.informationalInterviews
          : []
      ) as InformationalInterview[];
    },
  });
}

/**
 * Fetch current authenticated user's profile
 */
export function useProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => api.get<{ user: AuthUser }>("/api/auth/profile"),
    retry: false,
  });
}

// --- Mutations ---

interface LoginCredentials {
  email: string;
  password?: string;
}

interface AuthResponse {
  message?: string;
  token: string;
  user: AuthUser;
}

/**
 * Login mutation
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      api.post<AuthResponse>("/api/auth/login", credentials),
    onSuccess: () => {
      // Invalidate and refetch all user-related data
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });
}

interface RegisterCredentials {
  name: string;
  email: string;
  password?: string;
}

/**
 * Registration mutation
 */
export function useSignupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      api.post<AuthResponse>("/api/auth/register", credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });
}

/**
 * Update profile mutation
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updated: { fullName: string; email: string }) =>
      api.put<{ user: AuthUser }>("/api/auth/profile", updated),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile, data);
    },
  });
}

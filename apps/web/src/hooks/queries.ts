import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type {
  ApplicationInput,
  Contact,
  ContactInput,
  DashboardData,
  Employer,
  EmployerInput,
  JobApplication,
  InformationalInterview,
  UpcomingTask,
} from "../types";
import type { AuthUser } from "../lib/auth";

// --- Query Keys ---
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  applications: ["applications"] as const,
  tasks: ["tasks"] as const,
  interviews: ["interviews"] as const,
  profile: ["profile"] as const,
  employers: ["employers"] as const,
  contacts: ["contacts"] as const,
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

export function useTasksQuery() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const result = await api.get<{ tasks: UpcomingTask[] }>("/api/tasks");
      return result.tasks;
    },
  });
}

/**
 * Fetch all employers
 */
export function useEmployersQuery() {
  return useQuery({
    queryKey: queryKeys.employers,
    queryFn: async () => {
      const result = await api.get<{ employers: Employer[] }>("/api/employers");
      return result.employers;
    },
  });
}

/**
 * Fetch all contacts
 */
export function useContactsQuery() {
  return useQuery({
    queryKey: queryKeys.contacts,
    queryFn: async () => {
      const result = await api.get<{ contacts: Contact[] }>("/api/contacts");
      return result.contacts;
    },
  });
}

export function useCreateEmployerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employer: EmployerInput) =>
      api.post<{ employer: Employer }>("/api/employers", employer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employers }),
  });
}

export function useUpdateEmployerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<EmployerInput> }) =>
      api.patch<{ employer: Employer }>(`/api/employers/${id}`, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employers }),
  });
}

export function useDeleteEmployerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/employers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employers }),
  });
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contact: ContactInput) =>
      api.post<{ contact: Contact }>("/api/contacts", contact),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.contacts }),
  });
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<ContactInput> }) =>
      api.patch<{ contact: Contact }>(`/api/contacts/${id}`, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.contacts }),
  });
}

export function useDeleteContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/contacts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.contacts }),
  });
}

export function useCreateApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (application: ApplicationInput) =>
      api.post<{ application: JobApplication }>("/api/applications", application),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
  });
}

export function useUpdateApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<ApplicationInput> }) =>
      api.patch<{ application: JobApplication }>(`/api/applications/${id}`, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
  });
}

export function useDeleteApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/applications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
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
  const hasToken = Boolean(localStorage.getItem("careerlaunch_token"));
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => api.get<{ user: AuthUser }>("/api/auth/profile"),
    retry: false,
    enabled: hasToken,
  });
}

// --- Mutations ---

interface LoginCredentials {
  email: string;
  password: string;
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
  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      api.post<AuthResponse>("/api/auth/login", credentials),
  });
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  targetRole?: string;
}

/**
 * Registration mutation
 */
export function useSignupMutation() {
  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      api.post<AuthResponse>("/api/auth/register", credentials),
  });
}

/**
 * Update profile mutation
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updated: {
      name: string;
      email: string;
      currentRole?: string;
      targetRole?: string;
      weeklyGoal?: number;
    }) =>
      api.put<{ user: AuthUser }>("/api/auth/profile", updated),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile, data);
    },
  });
}

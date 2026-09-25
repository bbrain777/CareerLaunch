import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { appToastManager } from "../lib/toast";
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

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.get<DashboardData>("/api/dashboard"),
  });
}

export function useApplicationsQuery() {
  return useQuery({
    queryKey: queryKeys.applications,
    queryFn: async () => {
      const result = await api.get<{ applications: JobApplication[] } | JobApplication[]>("/api/applications");
      return Array.isArray(result) ? result : result.applications;
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

export function useEmployersQuery() {
  return useQuery({
    queryKey: queryKeys.employers,
    queryFn: async () => {
      const result = await api.get<{ employers: Employer[] }>("/api/employers");
      return result.employers;
    },
  });
}

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employers });
      appToastManager.add({
        title: "Employer created",
        description: data?.employer?.name ? `${data.employer.name} added to employers.` : "New employer added successfully.",
        variant: "success",
      });
    },
  });
}

export function useUpdateEmployerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<EmployerInput> }) =>
      api.patch<{ employer: Employer }>(`/api/employers/${id}`, changes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employers });
      appToastManager.add({
        title: "Employer updated",
        description: data?.employer?.name ? `${data.employer.name} details saved.` : "Employer details saved successfully.",
        variant: "success",
      });
    },
  });
}

export function useDeleteEmployerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/employers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employers });
      appToastManager.add({
        title: "Employer deleted",
        description: "Employer removed successfully.",
        variant: "default",
      });
    },
  });
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contact: ContactInput) =>
      api.post<{ contact: Contact }>("/api/contacts", contact),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      appToastManager.add({
        title: "Contact created",
        description: data?.contact
          ? `${[data.contact.firstName, data.contact.lastName].filter(Boolean).join(" ")} added to contacts.`
          : "New contact added successfully.",
        variant: "success",
      });
    },
  });
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<ContactInput> }) =>
      api.patch<{ contact: Contact }>(`/api/contacts/${id}`, changes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      appToastManager.add({
        title: "Contact updated",
        description: data?.contact
          ? `${[data.contact.firstName, data.contact.lastName].filter(Boolean).join(" ")} details updated.`
          : "Contact details updated successfully.",
        variant: "success",
      });
    },
  });
}

export function useDeleteContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      appToastManager.add({
        title: "Contact deleted",
        description: "Contact removed successfully.",
        variant: "default",
      });
    },
  });
}

export function useCreateApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (application: ApplicationInput) =>
      api.post<{ application: JobApplication }>("/api/applications", application),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      appToastManager.add({
        title: "Application created",
        description: data?.application?.company ? `Application for ${data.application.company} tracked.` : "Job application tracked successfully.",
        variant: "success",
      });
    },
  });
}

export function useUpdateApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<ApplicationInput> }) =>
      api.patch<{ application: JobApplication }>(`/api/applications/${id}`, changes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      appToastManager.add({
        title: "Application updated",
        description: data?.application?.company ? `Updated application for ${data.application.company}.` : "Application updated successfully.",
        variant: "success",
      });
    },
  });
}

export function useDeleteApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      appToastManager.add({
        title: "Application deleted",
        description: "Application removed successfully.",
        variant: "default",
      });
    },
  });
}

export function useInterviewsQuery() {
  return useQuery({
    queryKey: queryKeys.interviews,
    queryFn: async () => {
      const result = await api.get<
        { informationalInterviews: InformationalInterview[] } | InformationalInterview[]
      >("/api/informational-interviews");
      return Array.isArray(result) ? result : result.informationalInterviews;
    },
  });
}

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

export function useSignupMutation() {
  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      api.post<AuthResponse>("/api/auth/register", credentials),
  });
}

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

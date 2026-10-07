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
  InformationalInterviewInput,
  UpcomingTask,
  CareerDocument,
  Expense,
  ExpenseInput,
  ExpenseSummary,
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
  documents: ["documents"] as const,
  expenses: ["expenses"] as const,
  expenseSummary: ["expenses", "summary"] as const,
};

export function useExpensesQuery() {
  return useQuery({
    queryKey: queryKeys.expenses,
    queryFn: async () => {
      const result = await api.get<{ expenses: Expense[] }>("/api/expenses");
      return result.expenses;
    },
  });
}

export function useExpenseSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.expenseSummary,
    queryFn: async () => {
      const result = await api.get<{ summary: ExpenseSummary }>("/api/expenses/summary");
      return result.summary;
    },
  });
}

function invalidateExpenses(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenseSummary });
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expense: ExpenseInput) => api.post<{ expense: Expense }>("/api/expenses", expense),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      appToastManager.add({ title: "Expense saved", description: "The expense was added to your history.", variant: "success" });
    },
  });
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<ExpenseInput> }) =>
      api.patch<{ expense: Expense }>(`/api/expenses/${id}`, changes),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      appToastManager.add({ title: "Expense updated", description: "Your changes were saved.", variant: "success" });
    },
  });
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/expenses/${id}`),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      appToastManager.add({ title: "Expense deleted", description: "The expense was removed." });
    },
  });
}

export function useDocumentsQuery() {
  return useQuery({
    queryKey: queryKeys.documents,
    queryFn: async () => {
      const result = await api.get<{ documents: CareerDocument[] }>("/api/documents");
      return result.documents;
    },
  });
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: CareerDocument["type"] }) => {
      const form = new FormData();
      form.append("type", type);
      form.append("file", file);
      return api.post<{ document: CareerDocument }>("/api/documents", form);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
      appToastManager.add({
        title: "Document uploaded",
        description: `${data.document.fileName} is stored privately.`,
        variant: "success",
      });
    },
  });
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
      appToastManager.add({ title: "Document deleted", description: "The private file was removed." });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
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

export function useCreateInterviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (interview: InformationalInterviewInput) =>
      api.post<{ informationalInterview: InformationalInterview }>(
        "/api/informational-interviews",
        interview,
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      appToastManager.add({
        title: "Interview added",
        description: `Conversation with ${data.informationalInterview.contactName} added.`,
        variant: "success",
      });
    },
  });
}

export function useUpdateInterviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<InformationalInterviewInput> }) =>
      api.patch<{ informationalInterview: InformationalInterview }>(
        `/api/informational-interviews/${id}`,
        changes,
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      appToastManager.add({
        title: "Interview updated",
        description: `Conversation with ${data.informationalInterview.contactName} updated.`,
        variant: "success",
      });
    },
  });
}

export function useDeleteInterviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/informational-interviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      appToastManager.add({
        title: "Interview deleted",
        description: "The informational interview was removed.",
        variant: "default",
      });
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

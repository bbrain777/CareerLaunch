import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";
import { notifyError } from "./toast";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

const queryCache = new QueryCache({
  onError: (error, query) => {
    if (query.state.data !== undefined) return;
    notifyError(
      "Couldn't load data",
      errorMessage(error, "The API is unavailable. Ensure the API server is running.")
    );
  },
});

const mutationCache = new MutationCache({
  onError: (error) => {
    notifyError("Request failed", errorMessage(error, "Something went wrong. Please try again."));
  },
});

export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes fresh cache
      gcTime: 1000 * 60 * 10,   // 10 minutes garbage collection
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

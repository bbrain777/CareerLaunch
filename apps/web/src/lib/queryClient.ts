import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";
import { notifyError } from "./toast";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

export function shouldNotifyQueryError(
  error: unknown,
  hasCachedData: boolean,
  hasAuthToken: boolean,
): boolean {
  if (hasCachedData) return false;

  // An authenticated query can finish after logout has removed the token.
  // That expected race should not surface as an error on the public login page.
  return !(error instanceof ApiError && error.status === 401 && !hasAuthToken);
}

const queryCache = new QueryCache({
  onError: (error, query) => {
    if (!shouldNotifyQueryError(
      error,
      query.state.data !== undefined,
      Boolean(localStorage.getItem("careerlaunch_token")),
    )) return;
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

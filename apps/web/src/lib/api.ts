export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  const currentToken = localStorage.getItem("careerlaunch_token");
  if (!currentToken) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem("careerlaunch_token", data.token);
          if (data.user) {
            localStorage.setItem("careerlaunch_user", JSON.stringify(data.user));
          }
          return data.token;
        }
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  isRetry = false
): Promise<T> {
  const token = localStorage.getItem("careerlaunch_token");

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : (options.body as BodyInit | null | undefined),
  };

  const response = await fetch(endpoint, config);

  if (response.status === 401 && !isRetry && !endpoint.includes("/api/auth/login") && !endpoint.includes("/api/auth/refresh")) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      return request<T>(endpoint, { ...options, headers }, true);
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  let data: unknown = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorRecord = typeof data === "object" && data !== null ? (data as { message?: string }) : null;
    const errorMessage =
      errorRecord?.message ||
      (typeof data === "string" ? data : `Request failed with status ${response.status}`);
    throw new ApiError(response.status, errorMessage, data);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),

  download: async (endpoint: string) => {
    const token = localStorage.getItem("careerlaunch_token");
    const response = await fetch(endpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      throw new ApiError(response.status, "Document download failed");
    }
    return response.blob();
  },

  uploadWithProgress: <T>(
    endpoint: string,
    formData: FormData,
    onProgress?: (percent: number) => void
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint);

      const token = localStorage.getItem("careerlaunch_token");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        let responseData: any = null;
        try {
          responseData = JSON.parse(xhr.responseText);
        } catch {
          responseData = xhr.responseText;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseData as T);
        } else {
          const message =
            typeof responseData === "object" && responseData?.message
              ? responseData.message
              : `Upload failed with status ${xhr.status}`;
          reject(new ApiError(xhr.status, message, responseData));
        }
      };

      xhr.onerror = () => {
        reject(new ApiError(0, "Network error during file upload."));
      };

      xhr.send(formData);
    });
  },
};


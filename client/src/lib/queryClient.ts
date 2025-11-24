import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // First element is the base URL
    let url = queryKey[0] as string;
    const params: Record<string, string> = {};
    
    // Handle remaining queryKey elements
    // If queryKey is ["/api/leads", userId], userId should be appended to path
    // If queryKey is ["/api/leads", "userId", userId], they are key-value pairs for query params
    let i = 1;
    while (i < queryKey.length) {
      const element = queryKey[i];
      
      // Check if this looks like a key for a key-value pair (next element exists and is the value)
      if (i + 1 < queryKey.length && typeof element === "string" && typeof queryKey[i + 1] !== "object") {
        // This is a key-value pair
        const value = queryKey[i + 1];
        if (value !== null && value !== undefined) {
          params[element] = String(value);
        }
        i += 2;
      } else {
        // This is a path parameter - append to URL
        if (element !== null && element !== undefined) {
          url = `${url}/${String(element)}`;
        }
        i += 1;
      }
    }
    
    // Build final URL with query parameters
    const finalUrl = new URL(url, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      finalUrl.searchParams.append(key, value);
    });

    const res = await fetch(finalUrl.toString(), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

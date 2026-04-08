import { QueryClient, QueryFunction } from "@tanstack/react-query";

const APIBASE = "/api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(`${APIBASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn =
  <T>(options?: { on401?: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const unauthorizedBehavior = options?.on401 ?? "throw";
    const raw = (queryKey as string[]).join("");
    // нормализация: убираем ведущий /api/ если он уже есть в queryKey
    const norm = raw.replace(/^\/?(api\/)?/, "");
    const res = await fetch(`${APIBASE}/${norm}`, {
      credentials: "include",
    });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as T;
    }
    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

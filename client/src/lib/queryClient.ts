import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Handle unauthorized access by redirecting to login
            window.location.href = "/admin/login";
            throw new Error("Please login to access this resource");
          }
          if (res.status >= 500) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }

          const errorData = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(errorData.message || `${res.status}: ${res.statusText}`);
        }

        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Don't retry on 401 unauthorized
        if (error.message.includes("Please login")) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    }
  },
});
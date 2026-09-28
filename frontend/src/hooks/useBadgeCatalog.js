import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Badge definitions live on the server.
export function useBadgeList() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: () => api.get("/badges").then((r) => r.data.badges),
    staleTime: Infinity,
  });
}

// Map of badge id → badge.
export function useBadgeCatalog() {
  const { data } = useBadgeList();
  return Object.fromEntries((data ?? []).map((b) => [b.id, b]));
}

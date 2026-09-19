import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./api";

export function useFeatures(): Record<string, boolean> {
  const { data } = useQuery({
    queryKey: ["features"],
    queryFn: () => apiGet<Record<string, boolean>>("/api/features"),
    staleTime: 60_000,
  });
  return data ?? {};
}

/** Default true when unknown/loading so UI doesn't flicker off. */
export function useFeature(key: string): boolean {
  return useFeatures()[key] !== false;
}

import { useQuery } from "@tanstack/react-query";
import type { HealthReport } from "@/data/health-repository";
import { healthRepository } from "../container";

export function useHealth() {
  return useQuery<HealthReport>({
    queryKey: ["health"],
    queryFn: () => healthRepository.check(),
    refetchInterval: 10_000,
  });
}

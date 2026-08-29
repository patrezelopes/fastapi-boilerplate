import { Injectable, inject } from "@angular/core";
import type { HealthReport } from "../../data/health-repository";
import { HEALTH_REPOSITORY } from "../repositories";

@Injectable({ providedIn: "root" })
export class HealthService {
  private readonly repository = inject(HEALTH_REPOSITORY);

  check(): Promise<HealthReport> {
    return this.repository.check();
  }
}

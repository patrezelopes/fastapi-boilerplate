import type { components } from "./api/schema";
import type { HttpClient } from "./http-client";

export interface HealthReport {
  alive: boolean;
  ready: boolean;
}

export class HealthRepository {
  constructor(private readonly http: HttpClient) {}

  async check(): Promise<HealthReport> {
    const [alive, ready] = await Promise.all([this.probe("/health"), this.probe("/health/ready")]);
    return { alive: alive?.alive ?? false, ready: ready?.ready ?? false };
  }

  /** Uma sonda que responde 503 não é erro da aplicação: é a resposta. */
  private async probe(path: string): Promise<components["schemas"]["HealthResponse"] | null> {
    try {
      return await this.http.request<components["schemas"]["HealthResponse"]>(path);
    } catch {
      return null;
    }
  }
}

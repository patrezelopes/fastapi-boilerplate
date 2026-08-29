import { type Problem, ProblemError } from "@/domain/problem";
import type { TokenHolder } from "./token-holder";

const PROBLEM_CONTENT_TYPE = "application/problem+json";

/** Rotas que não devem disparar renovação: elas *são* o fluxo de sessão. */
const SESSION_ROUTES = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export class HttpClient {
  private renewal: Promise<boolean> | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly tokens: TokenHolder,
    private readonly onSessionLost: () => void = () => undefined,
  ) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response = await this.send(path, init);

    if (response.status === 401 && !SESSION_ROUTES.some((route) => path.startsWith(route))) {
      const renewed = await this.renewOnce();
      if (renewed) {
        response = await this.send(path, init);
      } else {
        this.tokens.clear();
        this.onSessionLost();
      }
    }

    if (!response.ok) throw new ProblemError(await toProblem(response));
    return (await readBody(response)) as T;
  }

  private async send(path: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers);
    if (init.body !== undefined) headers.set("Content-Type", "application/json");

    const token = this.tokens.read();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    return fetch(`${this.baseUrl}${path}`, { ...init, headers, credentials: "same-origin" });
  }

  /**
   * Renova o access token uma única vez, mesmo com várias requisições em voo:
   * todas esperam a mesma promessa. Sem isso, N chamadas simultâneas que tomam
   * 401 disparariam N rotações — e a detecção de reuso do backend derrubaria a
   * sessão inteira, tratando o próprio cliente como atacante.
   */
  private renewOnce(): Promise<boolean> {
    this.renewal ??= this.renew().finally(() => {
      this.renewal = null;
    });
    return this.renewal;
  }

  private async renew(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "same-origin",
    });

    if (!response.ok) return false;

    const body = (await response.json()) as RefreshResponse;
    this.tokens.write(body.access_token, body.expires_in);
    return true;
  }
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get("content-length") === "0") return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function toProblem(response: Response): Promise<Problem> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes(PROBLEM_CONTENT_TYPE) || contentType.includes("application/json")) {
    try {
      const body = (await response.json()) as Partial<Problem>;
      if (typeof body.title === "string" && typeof body.status === "number") {
        return body as Problem;
      }
    } catch {
      // corpo ilegível cai no genérico abaixo
    }
  }

  return {
    type: "about:blank",
    title: response.statusText || "Error",
    status: response.status,
    detail: "Não foi possível falar com o servidor.",
  };
}

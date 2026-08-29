import type { Session } from "@/domain/session";
import { sessionFrom } from "@/domain/session";
import type { User } from "@/domain/user";
import type { components } from "./api/schema";
import type { HttpClient } from "./http-client";
import { toUser } from "./user-mapper";

type TokenResponse = components["schemas"]["TokenResponse"];

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  name: string;
}

export class AuthRepository {
  constructor(private readonly http: HttpClient) {}

  async register(input: Registration): Promise<User> {
    return toUser(
      await this.http.request<components["schemas"]["User"]>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  }

  async login(input: Credentials): Promise<Session> {
    const body = await this.http.request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return sessionFrom(body.access_token, body.expires_in);
  }

  async logout(): Promise<void> {
    await this.http.request<null>("/auth/logout", { method: "POST" });
  }

  async me(): Promise<User> {
    return toUser(await this.http.request<components["schemas"]["User"]>("/auth/me"));
  }
}

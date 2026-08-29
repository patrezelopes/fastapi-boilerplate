import type { Page } from "@/domain/page";
import type { User } from "@/domain/user";
import type { components } from "./api/schema";
import type { HttpClient } from "./http-client";
import { toUser, toUserPage } from "./user-mapper";

export interface UserQuery {
  page?: number;
  perPage?: number;
  term?: string;
}

export interface NewUser {
  email: string;
  name: string;
  password: string;
}

export interface UserPatch {
  email?: string;
  name?: string;
}

export class UsersRepository {
  constructor(private readonly http: HttpClient) {}

  async list(query: UserQuery = {}): Promise<Page<User>> {
    const params = new URLSearchParams();
    params.set("page", String(query.page ?? 1));
    params.set("per_page", String(query.perPage ?? 20));
    if (query.term) params.set("q", query.term);

    return toUserPage(
      await this.http.request<components["schemas"]["UserPage"]>(`/users?${params.toString()}`),
    );
  }

  async get(id: string): Promise<User> {
    return toUser(await this.http.request<components["schemas"]["User"]>(`/users/${id}`));
  }

  async create(input: NewUser): Promise<User> {
    return toUser(
      await this.http.request<components["schemas"]["User"]>("/users", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  }

  async update(id: string, patch: UserPatch): Promise<User> {
    return toUser(
      await this.http.request<components["schemas"]["User"]>(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    );
  }

  async remove(id: string): Promise<void> {
    await this.http.request<null>(`/users/${id}`, { method: "DELETE" });
  }
}

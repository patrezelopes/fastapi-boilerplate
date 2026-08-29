import { Injectable, inject } from "@angular/core";
import type { NewUser, UserPatch, UserQuery } from "../../data/users-repository";
import type { Page } from "../../domain/page";
import type { User } from "../../domain/user";
import { USERS_REPOSITORY } from "../repositories";

@Injectable({ providedIn: "root" })
export class UsersService {
  private readonly repository = inject(USERS_REPOSITORY);

  list(query: UserQuery): Promise<Page<User>> {
    return this.repository.list(query);
  }

  get(id: string): Promise<User> {
    return this.repository.get(id);
  }

  create(input: NewUser): Promise<User> {
    return this.repository.create(input);
  }

  update(id: string, patch: UserPatch): Promise<User> {
    return this.repository.update(id, patch);
  }

  remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}

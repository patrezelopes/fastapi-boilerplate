import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { isEmpty } from "../../domain/page";
import { messageOf } from "../../domain/problem";
import type { User } from "../../domain/user";
import { UsersService } from "../../features/users/users.service";
import { ButtonComponent } from "../../ui/button.component";
import { FieldComponent } from "../../ui/field.component";
import { PaginationComponent } from "../../ui/pagination.component";
import { EmptyComponent, FailedComponent, LoadingComponent } from "../../ui/states.component";
import { UserTableComponent } from "../../ui/user-table.component";

@Component({
  selector: "app-users-page",
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    FieldComponent,
    PaginationComponent,
    EmptyComponent,
    FailedComponent,
    LoadingComponent,
    UserTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <div class="mb-6 flex items-end justify-between gap-4">
        <h1 class="text-2xl font-semibold">Usuários</h1>
        <app-button (click)="novo()">Novo usuário</app-button>
      </div>

      <div class="mb-6 max-w-sm">
        <app-field
          label="Buscar"
          fieldId="users-search"
          placeholder="nome ou e-mail"
          [control]="search"
        />
      </div>

      @if (users.isLoading()) {
        <app-loading />
      } @else if (users.error()) {
        <app-failed [message]="failureMessage()" [retryable]="true" (retry)="users.reload()" />
      } @else if (vazio()) {
        <app-empty>Nenhum usuário encontrado.</app-empty>
      } @else if (users.value(); as page) {
        <div class="flex flex-col gap-6">
          <app-user-table [users]="page.items" (open)="abrir($event)" (remove)="remover($event)" />
          <app-pagination
            [page]="page.page"
            [totalPages]="page.totalPages"
            (pageChange)="pagina.set($event)"
          />
        </div>
      }
    </section>
  `,
})
export class UsersPage {
  private readonly users_ = inject(UsersService);
  private readonly router = inject(Router);

  protected readonly search = new FormControl("", { nonNullable: true });
  protected readonly pagina = signal(1);
  private readonly termo = signal("");

  protected readonly users = resource({
    params: () => ({ page: this.pagina(), perPage: 10, term: this.termo() || undefined }),
    loader: ({ params }) => this.users_.list(params),
  });

  protected readonly vazio = computed(() => {
    const page = this.users.value();
    return page ? isEmpty(page) : false;
  });

  constructor() {
    this.search.valueChanges.subscribe((value) => {
      this.pagina.set(1);
      this.termo.set(value);
    });
  }

  protected failureMessage(): string {
    return messageOf(this.users.error());
  }

  protected novo(): void {
    void this.router.navigate(["/users/new"]);
  }

  protected abrir(user: User): void {
    void this.router.navigate(["/users", user.id]);
  }

  protected async remover(user: User): Promise<void> {
    await this.users_.remove(user.id);
    this.users.reload();
  }
}

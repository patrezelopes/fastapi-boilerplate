import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  resource,
  signal,
} from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { fieldErrorsOf, firstMessage, isNotFound, messageOf } from "../../domain/problem";
import { UsersService } from "../../features/users/users.service";
import { AlertComponent } from "../../ui/alert.component";
import { ButtonComponent } from "../../ui/button.component";
import { FieldComponent } from "../../ui/field.component";
import { FailedComponent, LoadingComponent } from "../../ui/states.component";
import { controlError } from "../form-errors";

@Component({
  selector: "app-user-detail-page",
  imports: [
    ReactiveFormsModule,
    AlertComponent,
    ButtonComponent,
    FieldComponent,
    FailedComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user.isLoading()) {
      <app-loading />
    } @else if (notFound()) {
      <app-failed message="Usuário não encontrado." />
    } @else if (user.error()) {
      <app-failed [message]="loadFailure()" [retryable]="true" (retry)="user.reload()" />
    } @else {
      <section class="max-w-sm">
        <h1 class="mb-6 text-2xl font-semibold">Editar usuário</h1>

        <form novalidate class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
          <app-field
            label="Nome"
            fieldId="detail-name"
            [control]="form.controls.name"
            [error]="error('name', 'Informe o nome')"
          />
          <app-field
            label="E-mail"
            fieldId="detail-email"
            type="email"
            [control]="form.controls.email"
            [error]="error('email', 'Informe o e-mail', 'Formato de e-mail inválido')"
          />

          @if (saved()) {
            <app-alert tone="success">Alterações salvas.</app-alert>
          }
          @if (generalError(); as message) {
            <app-alert tone="error">{{ message }}</app-alert>
          }

          <div class="flex gap-3">
            <app-button type="submit" [loading]="pending()">Salvar</app-button>
            <app-button type="button" variant="ghost" (click)="voltar()">Voltar</app-button>
          </div>
        </form>
      </section>
    }
  `,
})
export class UserDetailPage {
  readonly id = input.required<string>();

  private readonly users = inject(UsersService);
  private readonly router = inject(Router);

  protected readonly user = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.users.get(params.id),
  });

  protected readonly form = new FormGroup({
    name: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected readonly pending = signal(false);
  protected readonly saved = signal(false);
  protected readonly failure = signal<unknown>(null);

  constructor() {
    effect(() => {
      const loaded = this.user.value();
      if (loaded) this.form.setValue({ name: loaded.name, email: loaded.email });
    });
  }

  protected notFound(): boolean {
    return isNotFound(this.user.error());
  }

  protected loadFailure(): string {
    return messageOf(this.user.error());
  }

  protected error(field: "name" | "email", required: string, invalid?: string) {
    return firstMessage(
      controlError(this.form.controls[field], required, invalid),
      fieldErrorsOf(this.failure())[field],
    );
  }

  protected generalError(): string | undefined {
    const failure = this.failure();
    if (!failure || Object.keys(fieldErrorsOf(failure)).length > 0) return undefined;
    return messageOf(failure);
  }

  protected voltar(): void {
    void this.router.navigate(["/users"]);
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.pending.set(true);
    this.failure.set(null);
    this.saved.set(false);
    try {
      await this.users.update(this.id(), this.form.getRawValue());
      this.saved.set(true);
    } catch (error) {
      this.failure.set(error);
    } finally {
      this.pending.set(false);
    }
  }
}

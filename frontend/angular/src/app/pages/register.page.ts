import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { fieldErrorsOf, firstMessage, messageOf } from "../../domain/problem";
import { AuthService } from "../../features/auth/auth.service";
import { AlertComponent } from "../../ui/alert.component";
import { ButtonComponent } from "../../ui/button.component";
import { FieldComponent } from "../../ui/field.component";
import { controlError } from "../form-errors";

@Component({
  selector: "app-register-page",
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, ButtonComponent, FieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-sm">
      <h1 class="mb-6 text-2xl font-semibold">Criar conta</h1>

      <form novalidate class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
        <app-field
          label="Nome"
          fieldId="register-name"
          [control]="form.controls.name"
          [error]="error('name', 'Informe o nome')"
        />
        <app-field
          label="E-mail"
          fieldId="register-email"
          type="email"
          [control]="form.controls.email"
          [error]="error('email', 'Informe o e-mail', 'Formato de e-mail inválido')"
        />
        <app-field
          label="Senha"
          fieldId="register-password"
          type="password"
          autocomplete="new-password"
          [control]="form.controls.password"
          [error]="
            error('password', 'Informe a senha', 'A senha precisa de ao menos 12 caracteres')
          "
        />

        @if (generalError(); as message) {
          <app-alert tone="error">{{ message }}</app-alert>
        }

        <app-button type="submit" [loading]="pending()">Criar conta</app-button>
      </form>

      <p class="mt-6 text-sm text-stone-600">
        Já tem conta? <a routerLink="/login" class="underline">Entrar</a>
      </p>
    </section>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    name: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12)],
    }),
  });

  protected readonly pending = signal(false);
  protected readonly failure = signal<unknown>(null);

  protected error(field: "name" | "email" | "password", required: string, invalid?: string) {
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

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.pending.set(true);
    this.failure.set(null);
    try {
      await this.auth.register(this.form.getRawValue());
      await this.router.navigate(["/login"]);
    } catch (error) {
      this.failure.set(error);
    } finally {
      this.pending.set(false);
    }
  }
}

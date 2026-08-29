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
  selector: "app-login-page",
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, ButtonComponent, FieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-sm">
      <h1 class="mb-6 text-2xl font-semibold">Entrar</h1>

      <form novalidate class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
        <app-field
          label="E-mail"
          fieldId="login-email"
          type="email"
          autocomplete="email"
          [control]="form.controls.email"
          [error]="emailError()"
        />
        <app-field
          label="Senha"
          fieldId="login-password"
          type="password"
          autocomplete="current-password"
          [control]="form.controls.password"
          [error]="passwordError()"
        />

        @if (generalError(); as message) {
          <app-alert tone="error">{{ message }}</app-alert>
        }

        <app-button type="submit" [loading]="pending()">Entrar</app-button>
      </form>

      <p class="mt-6 text-sm text-stone-600">
        Não tem conta? <a routerLink="/register" class="underline">Criar conta</a>
      </p>
    </section>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly pending = signal(false);
  protected readonly failure = signal<unknown>(null);

  protected emailError(): string | undefined {
    return firstMessage(
      controlError(this.form.controls.email, "Informe o e-mail", "Formato de e-mail inválido"),
      fieldErrorsOf(this.failure())["email"],
    );
  }

  protected passwordError(): string | undefined {
    return firstMessage(
      controlError(this.form.controls.password, "Informe a senha"),
      fieldErrorsOf(this.failure())["password"],
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
      await this.auth.login(this.form.getRawValue());
      await this.router.navigate(["/users"]);
    } catch (error) {
      this.failure.set(error);
    } finally {
      this.pending.set(false);
    }
  }
}

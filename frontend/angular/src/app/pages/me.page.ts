import { ChangeDetectionStrategy, Component, inject, resource } from "@angular/core";
import { messageOf } from "../../domain/problem";
import { initialsOf } from "../../domain/user";
import { AuthService } from "../../features/auth/auth.service";
import { FailedComponent, LoadingComponent } from "../../ui/states.component";

@Component({
  selector: "app-me-page",
  imports: [FailedComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (me.isLoading()) {
      <app-loading />
    } @else if (me.error()) {
      <app-failed [message]="failureMessage()" [retryable]="true" (retry)="me.reload()" />
    } @else if (me.value(); as user) {
      <section>
        <h1 class="mb-6 text-2xl font-semibold">Meu perfil</h1>
        <div class="flex items-center gap-4 rounded border border-stone-200 bg-white p-6">
          <span
            aria-hidden="true"
            class="grid size-12 place-items-center rounded-full bg-stone-200 text-lg font-semibold text-stone-600"
          >
            {{ initials(user) }}
          </span>
          <dl class="text-sm">
            <dt class="sr-only">Nome</dt>
            <dd class="font-medium">{{ user.name }}</dd>
            <dt class="sr-only">E-mail</dt>
            <dd class="text-stone-600">{{ user.email }}</dd>
          </dl>
        </div>
      </section>
    }
  `,
})
export class MePage {
  private readonly auth = inject(AuthService);

  protected readonly me = resource({ loader: () => this.auth.me() });
  protected readonly initials = initialsOf;

  protected failureMessage(): string {
    return messageOf(this.me.error());
  }
}

import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { AuthService } from "../features/auth/auth.service";
import { ButtonComponent } from "../ui/button.component";

@Component({
  selector: "app-root",
  imports: [RouterLink, RouterOutlet, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-stone-50 text-stone-900">
      <header class="border-b border-stone-200 bg-white">
        <nav class="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4 text-sm">
          <a routerLink="/users" class="font-semibold">Boilerplate</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/users">Usuários</a>
            <a routerLink="/me">Meu perfil</a>
          }
          <a routerLink="/health">Situação</a>
          <span class="flex-1"></span>
          @if (auth.isAuthenticated()) {
            <app-button variant="ghost" (click)="sair()">Sair</app-button>
          } @else {
            <a routerLink="/login">Entrar</a>
          }
        </nav>
      </header>
      <main class="mx-auto max-w-4xl px-6 py-10">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async sair(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(["/login"]);
  }
}

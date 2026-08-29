import { ChangeDetectionStrategy, Component, inject, resource } from "@angular/core";
import { HealthService } from "../../features/health/health.service";
import { BadgeComponent } from "../../ui/badge.component";
import { LoadingComponent } from "../../ui/states.component";

@Component({
  selector: "app-health-page",
  imports: [BadgeComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h1 class="mb-6 text-2xl font-semibold">Situação do sistema</h1>

      @if (health.isLoading()) {
        <app-loading />
      } @else {
        <dl class="flex flex-col gap-3 rounded border border-stone-200 bg-white p-6 text-sm">
          <div class="flex items-center justify-between">
            <dt>Aplicação no ar</dt>
            <dd>
              <app-badge [ok]="alive()">{{ alive() ? "no ar" : "fora" }}</app-badge>
            </dd>
          </div>
          <div class="flex items-center justify-between">
            <dt>Pronta para tráfego</dt>
            <dd>
              <app-badge [ok]="ready()">{{ ready() ? "pronta" : "indisponível" }}</app-badge>
            </dd>
          </div>
        </dl>
      }
    </section>
  `,
})
export class HealthPage {
  private readonly service = inject(HealthService);

  protected readonly health = resource({ loader: () => this.service.check() });

  protected alive(): boolean {
    return this.health.value()?.alive ?? false;
  }

  protected ready(): boolean {
    return this.health.value()?.ready ?? false;
  }
}

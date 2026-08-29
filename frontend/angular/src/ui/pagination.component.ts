import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

@Component({
  selector: "app-pagination",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <nav aria-label="Paginação" class="flex items-center justify-between gap-4 text-sm">
        <button
          [disabled]="page() <= 1"
          class="rounded border border-stone-300 px-3 py-1 disabled:text-stone-400"
          (click)="pageChange.emit(page() - 1)"
        >
          Anterior
        </button>
        <span class="text-stone-600">Página {{ page() }} de {{ totalPages() }}</span>
        <button
          [disabled]="page() >= totalPages()"
          class="rounded border border-stone-300 px-3 py-1 disabled:text-stone-400"
          (click)="pageChange.emit(page() + 1)"
        >
          Próxima
        </button>
      </nav>
    }
  `,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();
}

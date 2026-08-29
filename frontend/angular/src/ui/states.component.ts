import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

/** Os quatro estados que toda tela que busca dados precisa tratar. */

@Component({
  selector: "app-loading",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p role="status" class="py-10 text-center text-sm text-stone-500">{{ label() }}</p>`,
})
export class LoadingComponent {
  readonly label = input("Carregando…");
}

@Component({
  selector: "app-empty",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p
      class="rounded border border-dashed border-stone-300 py-10 text-center text-sm text-stone-500"
    >
      <ng-content />
    </p>
  `,
})
export class EmptyComponent {}

@Component({
  selector: "app-failed",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="alert" class="rounded border border-red-300 bg-red-50 px-4 py-6 text-center">
      <p class="text-sm text-red-800">{{ message() }}</p>
      @if (retryable()) {
        <button class="mt-3 text-sm font-medium text-red-900 underline" (click)="retry.emit()">
          Tentar de novo
        </button>
      }
    </div>
  `,
})
export class FailedComponent {
  readonly message = input.required<string>();
  readonly retryable = input(false);
  readonly retry = output();
}

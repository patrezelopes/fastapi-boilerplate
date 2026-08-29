import { ChangeDetectionStrategy, Component, input } from "@angular/core";

const STYLES = {
  primary: "bg-stone-800 text-stone-50 hover:bg-stone-700 disabled:bg-stone-400",
  ghost: "border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:text-stone-400",
  danger: "border border-red-300 text-red-700 hover:bg-red-50 disabled:text-red-300",
} as const;

@Component({
  selector: "app-button",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [type]="type()" [disabled]="loading()" [attr.aria-busy]="loading()" [class]="classes()">
      @if (loading()) {
        Aguarde…
      } @else {
        <ng-content />
      }
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<keyof typeof STYLES>("primary");
  readonly loading = input(false);
  readonly type = input<"button" | "submit">("button");

  classes(): string {
    return `inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-800 disabled:cursor-not-allowed ${STYLES[this.variant()]}`;
  }
}

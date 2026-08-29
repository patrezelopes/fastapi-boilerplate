import { ChangeDetectionStrategy, Component, input } from "@angular/core";

const TONES = {
  error: "border-red-300 bg-red-50 text-red-800",
  info: "border-stone-300 bg-stone-50 text-stone-700",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
} as const;

@Component({
  selector: "app-alert",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [attr.role]="tone() === 'error' ? 'alert' : 'status'" [class]="classes()">
      <ng-content />
    </div>
  `,
})
export class AlertComponent {
  readonly tone = input<keyof typeof TONES>("info");

  classes(): string {
    return `rounded border px-4 py-3 text-sm ${TONES[this.tone()]}`;
  }
}

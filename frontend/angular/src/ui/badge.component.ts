import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "app-badge",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="classes()">
      <span [class]="dotClasses()" aria-hidden="true"></span>
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  readonly ok = input.required<boolean>();

  classes(): string {
    return `inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${
      this.ok() ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
    }`;
  }

  dotClasses(): string {
    return `size-1.5 rounded-full ${this.ok() ? "bg-emerald-600" : "bg-red-600"}`;
  }
}

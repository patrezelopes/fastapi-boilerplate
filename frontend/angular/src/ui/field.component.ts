import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { ReactiveFormsModule, type FormControl } from "@angular/forms";

/** Rótulo associado e erro anunciado — ver `.claude/rules/frontend.md`. */
@Component({
  selector: "app-field",
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1">
      <label [for]="fieldId()" class="text-sm font-medium text-stone-700">{{ label() }}</label>
      <input
        [id]="fieldId()"
        [formControl]="control()"
        [type]="type()"
        [placeholder]="placeholder()"
        [attr.autocomplete]="autocomplete()"
        [attr.aria-invalid]="error() ? true : null"
        [attr.aria-describedby]="error() ? fieldId() + '-error' : null"
        [class]="classes()"
      />
      @if (error(); as message) {
        <p [id]="fieldId() + '-error'" role="alert" class="text-sm text-red-700">{{ message }}</p>
      }
    </div>
  `,
})
export class FieldComponent {
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly fieldId = input.required<string>();
  readonly error = input<string | undefined>(undefined);
  readonly type = input("text");
  readonly placeholder = input("");
  readonly autocomplete = input<string | null>(null);

  classes(): string {
    return `rounded border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-800 ${
      this.error() ? "border-red-400 bg-red-50" : "border-stone-300"
    }`;
  }
}

import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { initialsOf, type User } from "../domain/user";

@Component({
  selector: "app-user-table",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table class="w-full border-collapse text-sm">
      <caption class="sr-only">
        Usuários cadastrados
      </caption>
      <thead>
        <tr
          class="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500"
        >
          <th class="py-2 font-medium">Nome</th>
          <th class="py-2 font-medium">E-mail</th>
          <th class="py-2"></th>
        </tr>
      </thead>
      <tbody>
        @for (user of users(); track user.id) {
          <tr class="border-b border-stone-200 hover:bg-stone-50">
            <td class="py-2">
              <span class="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  class="grid size-7 place-items-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600"
                >
                  {{ initials(user) }}
                </span>
                {{ user.name }}
              </span>
            </td>
            <td class="py-2 text-stone-600">{{ user.email }}</td>
            <td class="py-2 text-right">
              <button class="mr-3 text-stone-700 underline" (click)="open.emit(user)">Abrir</button>
              <button
                [attr.aria-label]="'Remover ' + user.name"
                class="text-red-700 underline"
                (click)="remove.emit(user)"
              >
                Remover
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class UserTableComponent {
  readonly users = input.required<User[]>();
  readonly open = output<User>();
  readonly remove = output<User>();

  initials = initialsOf;
}

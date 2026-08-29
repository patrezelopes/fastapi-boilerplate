import type { AbstractControl } from "@angular/forms";

/**
 * Traduz o estado de validação de um controle na mensagem que a tela mostra.
 *
 * O Angular expõe erros como um mapa de chaves (`required`, `email`,
 * `minlength`); as outras duas stacks recebem a mensagem pronta do Zod. Esta
 * função é onde essa diferença de idioma começa e termina.
 */
export function controlError(
  control: AbstractControl,
  required: string,
  invalid?: string,
): string | undefined {
  if (!control.touched && !control.dirty) return undefined;
  if (control.hasError("required")) return required;
  if (control.hasError("email") && invalid) return invalid;
  if (control.hasError("minlength") && invalid) return invalid;
  return undefined;
}

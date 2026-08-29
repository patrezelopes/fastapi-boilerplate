import { FormControl, Validators } from "@angular/forms";
import { describe, expect, it } from "vitest";
import { controlError } from "./form-errors";

function control(value: string, validators = [Validators.required]) {
  const created = new FormControl(value, { nonNullable: true, validators });
  created.markAsTouched();
  return created;
}

describe("controlError", () => {
  it("cala enquanto o campo não foi tocado", () => {
    const intocado = new FormControl("", { nonNullable: true, validators: [Validators.required] });

    expect(controlError(intocado, "Informe o nome")).toBeUndefined();
  });

  it("cobra o obrigatório depois de tocado", () => {
    expect(controlError(control(""), "Informe o nome")).toBe("Informe o nome");
  });

  it("reporta formato inválido quando há mensagem para isso", () => {
    const email = control("não-é-email", [Validators.required, Validators.email]);

    expect(controlError(email, "Informe o e-mail", "Formato inválido")).toBe("Formato inválido");
  });

  it("cala quando o campo está válido", () => {
    expect(controlError(control("Ana"), "Informe o nome")).toBeUndefined();
  });

  it("usa a mensagem de inválido também para tamanho mínimo", () => {
    const senha = control("curta", [Validators.required, Validators.minLength(12)]);

    expect(controlError(senha, "Informe a senha", "Mínimo de 12")).toBe("Mínimo de 12");
  });
});

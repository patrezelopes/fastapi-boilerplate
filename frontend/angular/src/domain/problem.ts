/** O envelope RFC 9457, do lado de cá. */
export interface FieldError {
  field: string;
  message: string;
}

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: FieldError[];
}

export class ProblemError extends Error {
  readonly problem: Problem;

  constructor(problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = "ProblemError";
    this.problem = problem;
  }
}

/** Erros por campo, prontos para casar com os nomes do formulário. */
export function fieldErrorsOf(error: unknown): Record<string, string> {
  if (!(error instanceof ProblemError)) return {};
  const entries = (error.problem.errors ?? []).map((e) => [e.field, e.message] as const);
  return Object.fromEntries(entries);
}

/** A mensagem que se mostra ao usuário quando o erro não é de campo. */
export function messageOf(error: unknown, fallback = "Algo deu errado. Tente de novo."): string {
  if (error instanceof ProblemError) return error.problem.detail ?? error.problem.title;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ProblemError && error.problem.status === 401;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ProblemError && error.problem.status === 404;
}

/**
 * A primeira mensagem existente entre as candidatas.
 *
 * Um campo pode falhar na validação local ou no servidor, e a tela mostra a que
 * houver. Sem isto, cada campo de cada formulário repetiria o mesmo `??` — e é
 * essa repetição que faz a complexidade de uma página estourar o limite.
 */
export function firstMessage(...candidates: (string | undefined)[]): string | undefined {
  return candidates.find((candidate) => candidate !== undefined && candidate !== "");
}

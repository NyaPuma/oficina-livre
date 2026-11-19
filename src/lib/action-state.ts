export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const idleState: ActionState = { status: "idle", message: "" };

export function errorState(message: string): ActionState {
  return { status: "error", message };
}

export function successState(message: string): ActionState {
  return { status: "success", message };
}

/** Converte os erros do Zod numa mensagem legível em português. */
export function firstZodIssue(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): string {
  const issue = error.issues[0];
  if (!issue) return "Dados inválidos.";
  const field = issue.path.join(".");
  return field ? `${field}: ${issue.message}` : issue.message;
}

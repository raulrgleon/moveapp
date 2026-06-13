/** Pilot action blocks embedded in assistant replies: ::pilot-action{...}:: */

export interface PilotActionPayload {
  action: string;
  taskId?: string;
  title?: string;
  category?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  budgetItemId?: string;
  categoryName?: string;
  actual?: number;
}

const ACTION_RE = /::pilot-action(\{[\s\S]*?\})::/g;

export function buildPilotActionInstructions(): string {
  return `PILOT ACTIONS (when user asks you to DO something — mark task done, add task, log expense):
- Only append an action block if the user clearly wants you to perform it now.
- Put action block at the very END of your reply, on its own line, after your friendly message.
- Format exactly: ::pilot-action{"action":"NAME",...}::
- Available actions:
  • complete_task — {"action":"complete_task","taskId":"UUID"}
  • set_task_status — {"action":"set_task_status","taskId":"UUID","status":"pending|in_progress|completed"}
  • add_checklist_task — {"action":"add_checklist_task","title":"...","category":"Packing","priority":"high|medium|low","dueDate":"YYYY-MM-DD"}
  • update_budget_actual — {"action":"update_budget_actual","budgetItemId":"UUID","actual":1234} OR {"action":"update_budget_actual","categoryName":"Fuel","actual":1234}
- Use task/budget IDs from CHECKLIST and BUDGET sections below. Never invent IDs.
- Max one action block per reply.`;
}

export function parsePilotActions(text: string): PilotActionPayload[] {
  const actions: PilotActionPayload[] = [];
  const re = new RegExp(ACTION_RE.source, ACTION_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as PilotActionPayload;
      if (parsed.action) actions.push(parsed);
    } catch {
      /* skip malformed */
    }
  }
  return actions;
}

export function stripPilotActions(text: string): string {
  return text.replace(ACTION_RE, "").trim();
}

export function formatActionResultMessage(
  locale: "en" | "es",
  results: { ok: boolean; label: string }[]
): string {
  if (results.length === 0) return "";
  const ok = results.filter((r) => r.ok);
  if (ok.length === 0) {
    return locale === "es"
      ? "\n\n_No pude completar la acción automáticamente._"
      : "\n\n_Couldn't complete the action automatically._";
  }
  const lines = ok.map((r) => `✓ ${r.label}`).join("\n");
  return locale === "es"
    ? `\n\n**Hecho:**\n${lines}`
    : `\n\n**Done:**\n${lines}`;
}

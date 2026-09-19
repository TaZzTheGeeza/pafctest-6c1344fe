import { supabase } from "@/integrations/supabase/client";

export type QuestionType = "multiple_choice" | "multi_select" | "written" | "true_false" | "number";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  multi_select: "Tick all that apply",
  written: "Written answer",
  true_false: "True or false",
  number: "Number",
};

export interface HomeworkQuestion {
  id: string;
  task_id: string;
  position: number;
  question_type: QuestionType;
  prompt: string;
  options: string[];
  required: boolean;
}

/** Draft used by the coach builder - `id` is null until saved. */
export interface QuestionDraft {
  id: string | null;
  question_type: QuestionType;
  prompt: string;
  options: string[];
  required: boolean;
  correct: string[];
}

export interface HomeworkAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  answer: any;
  is_correct: boolean | null;
}

export const emptyDraft = (): QuestionDraft => ({
  id: null,
  question_type: "multiple_choice",
  prompt: "",
  options: ["", ""],
  required: true,
  correct: [],
});

export const needsOptions = (type: QuestionType) => type === "multiple_choice" || type === "multi_select";

function normaliseRow(row: any): HomeworkQuestion {
  return {
    id: row.id,
    task_id: row.task_id,
    position: row.position ?? 0,
    question_type: (row.question_type || "written") as QuestionType,
    prompt: row.prompt || "",
    options: Array.isArray(row.options) ? row.options.map((o: any) => String(o)) : [],
    required: !!row.required,
  };
}

/** Questions for one or more tasks, ordered as the coach arranged them. */
export async function fetchQuestions(taskIds: string[]): Promise<Record<string, HomeworkQuestion[]>> {
  if (!taskIds.length) return {};
  const { data, error } = await supabase
    .from("homework_questions")
    .select("*")
    .in("task_id", taskIds)
    .order("position", { ascending: true });
  if (error) throw error;
  const map: Record<string, HomeworkQuestion[]> = {};
  for (const row of data || []) {
    const q = normaliseRow(row);
    (map[q.task_id] ||= []).push(q);
  }
  return map;
}

/** Answer keys are coach/admin only - parents get an empty map. */
export async function fetchAnswerKeys(questionIds: string[]): Promise<Record<string, string[]>> {
  if (!questionIds.length) return {};
  const { data } = await supabase
    .from("homework_question_keys")
    .select("question_id, correct_answers")
    .in("question_id", questionIds);
  const map: Record<string, string[]> = {};
  for (const row of data || []) {
    map[row.question_id] = Array.isArray(row.correct_answers)
      ? (row.correct_answers as any[]).map((v) => String(v))
      : [];
  }
  return map;
}

export async function fetchAnswers(submissionIds: string[]): Promise<Record<string, HomeworkAnswer[]>> {
  if (!submissionIds.length) return {};
  const { data, error } = await supabase
    .from("homework_answers")
    .select("*")
    .in("submission_id", submissionIds);
  if (error) throw error;
  const map: Record<string, HomeworkAnswer[]> = {};
  for (const row of data || []) {
    (map[row.submission_id] ||= []).push(row as HomeworkAnswer);
  }
  return map;
}

/** Load a task's questions back into coach drafts (with the answer key). */
export async function fetchDrafts(taskId: string): Promise<QuestionDraft[]> {
  const byTask = await fetchQuestions([taskId]);
  const questions = byTask[taskId] || [];
  const keys = await fetchAnswerKeys(questions.map((q) => q.id));
  return questions.map((q) => ({
    id: q.id,
    question_type: q.question_type,
    prompt: q.prompt,
    options: q.options.length ? q.options : needsOptions(q.question_type) ? ["", ""] : [],
    required: q.required,
    correct: keys[q.id] || [],
  }));
}

export function validateDrafts(drafts: QuestionDraft[]): string | null {
  for (const [i, d] of drafts.entries()) {
    if (!d.prompt.trim()) return `Question ${i + 1} needs a question to ask.`;
    if (needsOptions(d.question_type)) {
      const filled = d.options.map((o) => o.trim()).filter(Boolean);
      if (filled.length < 2) return `Question ${i + 1} needs at least two answer options.`;
    }
  }
  return null;
}

/**
 * Save a task's question sheet: updates kept questions, inserts new ones and
 * removes deleted ones. Correct answers live in a coach-only key table so
 * families never receive them.
 */
export async function saveQuestions(taskId: string, drafts: QuestionDraft[]): Promise<void> {
  const { data: existing } = await supabase.from("homework_questions").select("id").eq("task_id", taskId);
  const keepIds = drafts.map((d) => d.id).filter(Boolean) as string[];
  const removed = (existing || []).map((r) => r.id).filter((id) => !keepIds.includes(id));
  if (removed.length) {
    await supabase.from("homework_questions").delete().in("id", removed);
  }

  for (const [index, draft] of drafts.entries()) {
    const options = needsOptions(draft.question_type)
      ? draft.options.map((o) => o.trim()).filter(Boolean)
      : draft.question_type === "true_false"
        ? ["True", "False"]
        : [];
    const correct = draft.correct
      .map((c) => c.trim())
      .filter((c) => c && (!options.length || options.includes(c)));

    const payload = {
      task_id: taskId,
      position: index,
      question_type: draft.question_type,
      prompt: draft.prompt.trim(),
      options,
      required: draft.required,
    };

    let questionId = draft.id;
    if (questionId) {
      const { error } = await supabase.from("homework_questions").update(payload).eq("id", questionId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("homework_questions").insert(payload).select("id").single();
      if (error) throw error;
      questionId = data.id;
    }

    if (correct.length) {
      const { error } = await supabase
        .from("homework_question_keys")
        .upsert({ question_id: questionId, correct_answers: correct }, { onConflict: "question_id" });
      if (error) throw error;
    } else {
      await supabase.from("homework_question_keys").delete().eq("question_id", questionId);
    }
  }
}

/** Save a child's answers - marking happens in the database. */
export async function saveAnswers(
  submissionId: string,
  questions: HomeworkQuestion[],
  answers: Record<string, any>,
): Promise<void> {
  const rows = questions
    .map((q) => ({ submission_id: submissionId, question_id: q.id, answer: answers[q.id] ?? null }))
    .filter((r) => r.answer !== null && r.answer !== "" && !(Array.isArray(r.answer) && r.answer.length === 0));
  if (!rows.length) return;
  const { error } = await supabase.from("homework_answers").insert(rows);
  if (error) throw error;
}

export function missingRequired(questions: HomeworkQuestion[], answers: Record<string, any>): HomeworkQuestion[] {
  return questions.filter((q) => {
    if (!q.required) return false;
    const a = answers[q.id];
    if (a === undefined || a === null || a === "") return true;
    if (Array.isArray(a) && a.length === 0) return true;
    return false;
  });
}

export function scoreLabel(questions: HomeworkQuestion[], answers: HomeworkAnswer[]): string | null {
  const marked = answers.filter((a) => a.is_correct !== null);
  if (!marked.length) return null;
  const right = marked.filter((a) => a.is_correct).length;
  return `${right}/${marked.length}`;
}

export function answerText(value: any): string {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

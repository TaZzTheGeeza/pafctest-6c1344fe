import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HomeworkQuestion } from "@/lib/homeworkQuestions";
import { ListChecks } from "lucide-react";

interface Props {
  questions: HomeworkQuestion[];
  answers: Record<string, any>;
  onChange: (answers: Record<string, any>) => void;
}

export default function AnswerSheet({ questions, answers, onChange }: Props) {
  if (!questions.length) return null;

  const set = (id: string, value: any) => onChange({ ...answers, [id]: value });

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-4">
      <p className="text-[10px] font-display uppercase tracking-widest text-primary flex items-center gap-2">
        <ListChecks className="h-3.5 w-3.5" /> Question sheet ({questions.length})
      </p>

      {questions.map((q, index) => {
        const value = answers[q.id];
        return (
          <div key={q.id} className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {index + 1}. {q.prompt}
              {q.required && <span className="text-primary ml-1">*</span>}
            </p>

            {q.question_type === "written" && (
              <Textarea
                value={value || ""}
                onChange={(e) => set(q.id, e.target.value)}
                placeholder="Type your answer"
                className="min-h-[70px] text-sm bg-background"
              />
            )}

            {q.question_type === "number" && (
              <Input
                type="number"
                value={value ?? ""}
                onChange={(e) => set(q.id, e.target.value)}
                placeholder="Enter a number"
                className="max-w-[160px] bg-background"
              />
            )}

            {(q.question_type === "multiple_choice" || q.question_type === "true_false") && (
              <div className="flex flex-wrap gap-2">
                {(q.question_type === "true_false" ? ["True", "False"] : q.options).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set(q.id, opt)}
                    className={`px-3 py-2 rounded-sm text-xs font-display uppercase tracking-wider border transition-colors ${
                      value === opt
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.question_type === "multi_select" && (
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => {
                  const selected = Array.isArray(value) && value.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        set(
                          q.id,
                          selected
                            ? (value as string[]).filter((v: string) => v !== opt)
                            : [...(Array.isArray(value) ? value : []), opt],
                        )
                      }
                      className={`px-3 py-2 rounded-sm text-xs font-display uppercase tracking-wider border transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

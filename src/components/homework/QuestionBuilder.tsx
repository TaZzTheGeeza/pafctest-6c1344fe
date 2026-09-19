import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowUp, ArrowDown, ListChecks } from "lucide-react";
import {
  QUESTION_TYPE_LABELS,
  QuestionDraft,
  QuestionType,
  emptyDraft,
  needsOptions,
} from "@/lib/homeworkQuestions";

interface Props {
  drafts: QuestionDraft[];
  onChange: (drafts: QuestionDraft[]) => void;
}

export default function QuestionBuilder({ drafts, onChange }: Props) {
  const update = (index: number, patch: Partial<QuestionDraft>) =>
    onChange(drafts.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= drafts.length) return;
    const next = [...drafts];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const changeType = (index: number, type: QuestionType) => {
    const d = drafts[index];
    update(index, {
      question_type: type,
      options: needsOptions(type) ? (d.options.length ? d.options : ["", ""]) : [],
      correct: type === "true_false" ? d.correct.filter((c) => c === "True" || c === "False") : [],
    });
  };

  const toggleCorrect = (index: number, value: string, multi: boolean) => {
    const d = drafts[index];
    if (multi) {
      const next = d.correct.includes(value) ? d.correct.filter((c) => c !== value) : [...d.correct, value];
      update(index, { correct: next });
    } else {
      update(index, { correct: d.correct[0] === value ? [] : [value] });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <ListChecks className="h-3.5 w-3.5 text-primary" /> Question sheet ({drafts.length})
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...drafts, emptyDraft()])}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add question
        </Button>
      </div>

      {drafts.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Optional. Add questions and the players answer them online - multiple choice, written answers and more.
        </p>
      )}

      {drafts.map((d, index) => {
        const multi = d.question_type === "multi_select";
        const choiceValues = needsOptions(d.question_type)
          ? d.options
          : d.question_type === "true_false"
            ? ["True", "False"]
            : [];
        return (
          <div key={d.id || `new-${index}`} className="bg-background border border-border rounded-sm p-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-display uppercase tracking-widest text-primary">Q{index + 1}</span>
              <select
                value={d.question_type}
                onChange={(e) => changeType(index, e.target.value as QuestionType)}
                className="bg-card border border-border rounded-md px-2 py-1 text-xs"
              >
                {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground ml-auto">
                <input
                  type="checkbox"
                  checked={d.required}
                  onChange={(e) => update(index, { required: e.target.checked })}
                />
                Required
              </label>
              <button type="button" className="p-1 text-muted-foreground hover:text-primary" onClick={() => move(index, -1)} aria-label="Move up">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="p-1 text-muted-foreground hover:text-primary" onClick={() => move(index, 1)} aria-label="Move down">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-destructive"
                onClick={() => onChange(drafts.filter((_, i) => i !== index))}
                aria-label="Delete question"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <Input
              value={d.prompt}
              onChange={(e) => update(index, { prompt: e.target.value })}
              placeholder="What do you want to ask?"
            />

            {needsOptions(d.question_type) && (
              <div className="space-y-2">
                {d.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type={multi ? "checkbox" : "radio"}
                      checked={d.correct.includes(opt) && !!opt.trim()}
                      onChange={() => opt.trim() && toggleCorrect(index, opt, multi)}
                      aria-label="Correct answer"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const oldValue = opt;
                        const options = d.options.map((o, i) => (i === oi ? e.target.value : o));
                        const correct = d.correct.map((c) => (c === oldValue ? e.target.value : c));
                        update(index, { options, correct });
                      }}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1"
                    />
                    {d.options.length > 2 && (
                      <button
                        type="button"
                        className="p-1 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          update(index, {
                            options: d.options.filter((_, i) => i !== oi),
                            correct: d.correct.filter((c) => c !== opt),
                          })
                        }
                        aria-label="Remove option"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {d.options.length < 6 && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => update(index, { options: [...d.options, ""] })}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add option
                  </Button>
                )}
              </div>
            )}

            {d.question_type === "true_false" && (
              <div className="flex gap-3">
                {choiceValues.map((value) => (
                  <label key={value} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="radio"
                      checked={d.correct[0] === value}
                      onChange={() => toggleCorrect(index, value, false)}
                    />
                    {value}
                  </label>
                ))}
              </div>
            )}

            {d.question_type === "number" && (
              <Input
                value={d.correct[0] || ""}
                onChange={(e) => update(index, { correct: e.target.value.trim() ? [e.target.value] : [] })}
                placeholder="Correct number (leave blank if there isn't one)"
                inputMode="numeric"
              />
            )}

            {d.question_type !== "written" && (
              <p className="text-[10px] text-muted-foreground">
                Tick the correct answer to mark it automatically, or leave it blank for an opinion question.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

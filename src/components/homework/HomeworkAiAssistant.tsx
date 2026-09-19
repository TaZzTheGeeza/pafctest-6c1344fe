import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { QuestionDraft, QuestionType } from "@/lib/homeworkQuestions";
import { Loader2, Sparkle, Wand2 } from "lucide-react";

interface Props {
  teamName: string;
  onResult: (result: { title: string; description: string; questions: QuestionDraft[] }) => void;
}

const IDEAS = [
  "Cruyff turn practice",
  "Keepy-uppies challenge",
  "Weak foot passing against a wall",
  "Dribbling round cones at speed",
  "Watch a match and spot good movement",
];

export default function HomeworkAiAssistant({ teamName, onResult }: Props) {
  const { toast } = useToast();
  const [idea, setIdea] = useState("");
  const [questionCount, setQuestionCount] = useState(3);
  const [loading, setLoading] = useState(false);

  const generate = async (text?: string) => {
    const prompt = (text ?? idea).trim();
    if (!prompt) {
      toast({ title: "Type what you want them to practise", variant: "destructive" });
      return;
    }
    setIdea(prompt);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-homework", {
        body: { idea: prompt, teamName, ageHint: teamName, questionCount },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const questions: QuestionDraft[] = ((data as any)?.questions || []).map((q: any) => ({
        id: null,
        question_type: q.question_type as QuestionType,
        prompt: q.prompt,
        options: q.options?.length ? q.options : ["", ""],
        required: !!q.required,
        correct: q.correct || [],
      }));

      onResult({
        title: (data as any)?.title || "",
        description: (data as any)?.description || "",
        questions,
      });
      toast({ title: "Homework drafted", description: "Have a read, tweak anything, then set it." });
    } catch (err: any) {
      toast({ title: "Could not draft that", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background border border-primary/30 rounded-sm p-4 space-y-3">
      <p className="text-xs font-display uppercase tracking-wider text-primary flex items-center gap-2">
        <Wand2 className="h-3.5 w-3.5" /> Build it for me
      </p>
      <p className="text-xs text-muted-foreground">
        Type a few words and the assistant writes the task, the instructions and the question sheet for you.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              e.preventDefault();
              generate();
            }
          }}
          placeholder="e.g. 50 keepy-uppies and a video of their best run"
          className="flex-1"
        />
        <div className="flex gap-2">
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="bg-card border border-border rounded-md px-2 py-2 text-xs"
            aria-label="Number of questions"
          >
            <option value={0}>No questions</option>
            <option value={2}>2 questions</option>
            <option value={3}>3 questions</option>
            <option value={5}>5 questions</option>
          </select>
          <Button type="button" onClick={() => generate()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkle className="h-4 w-4 mr-2" />}
            {loading ? "Drafting..." : "Draft it"}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {IDEAS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => generate(s)}
            className="text-[11px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

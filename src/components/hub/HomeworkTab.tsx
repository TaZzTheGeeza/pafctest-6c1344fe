import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { uploadHomeworkMedia, getHomeworkMediaUrl } from "@/lib/homework";
import { CLUB_TEAMS } from "@/lib/teamConfig";
import AnswerSheet from "@/components/homework/AnswerSheet";
import {
  HomeworkAnswer, HomeworkQuestion, answerText, fetchAnswers, fetchQuestions, missingRequired, saveAnswers, scoreLabel,
} from "@/lib/homeworkQuestions";

const teamLabel = (slug: string) => CLUB_TEAMS.find((t) => t.slug === slug)?.name || slug;
import { BookOpen, Check, Heart, MessageSquare, Star, Upload, Video, Loader2, X } from "lucide-react";

interface Task {
  id: string;
  team_slug: string;
  title: string;
  description: string | null;
  drill_media_path: string | null;
  drill_media_type: string | null;
  due_date: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  task_id: string;
  player_registration_id: string | null;
  player_name: string;
  user_id: string;
  proof_path: string | null;
  proof_type: string | null;
  note: string | null;
  coach_liked: boolean;
  completed_at: string;
}

interface Feedback {
  id: string;
  submission_id: string;
  comment: string;
  created_at: string;
  coach_id: string;
}

interface Child {
  id: string | null;
  name: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfWeek(d = new Date()): string {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export default function HomeworkTab({ teamSlug }: { teamSlug: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [star, setStar] = useState<any>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [drillUrls, setDrillUrls] = useState<Record<string, string>>({});
  const [questionsByTask, setQuestionsByTask] = useState<Record<string, HomeworkQuestion[]>>({});
  const [answersBySubmission, setAnswersBySubmission] = useState<Record<string, HomeworkAnswer[]>>({});
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const tasksPromise = supabase
        .from("homework_tasks")
        .select("*")
        .eq("team_slug", teamSlug)
        .order("due_date", { ascending: true, nullsFirst: false });

      // Children: direct registrations for this account, plus guardian links.
      const regPromise = supabase
        .from("player_registrations")
        .select("id, player_first_name, player_last_name")
        .eq("team_slug", teamSlug)
        .or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`);

      const guardianPromise = supabase
        .from("guardians")
        .select("player_name, team_slug")
        .eq("parent_user_id", user.id)
        .in("status", ["active", "approved", "pending", "linked"])
        .eq("team_slug", teamSlug);

      const [tasksRes, regRes, guardianRes] = await Promise.all([tasksPromise, regPromise, guardianPromise]);
      if (tasksRes.error) throw tasksRes.error;

      setTasks((tasksRes.data || []) as Task[]);

      const kids: Child[] = (regRes.data || []).map((r) => ({
        id: r.id,
        name: `${r.player_first_name ?? ""} ${r.player_last_name ?? ""}`.trim(),
      }));
      const guardianKids: Child[] = (guardianRes.data || []).map((g) => ({
        id: null,
        name: g.player_name,
      }));
      const merged = [...kids];
      for (const gk of guardianKids) {
        if (!merged.some((k) => k.name.toLowerCase() === gk.name.toLowerCase())) merged.push(gk);
      }
      setChildren(merged);
      if (merged.length > 0 && !selectedChildId) setSelectedChildId(merged[0].id);

      const { data: subs } = await supabase
        .from("homework_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      setSubmissions((subs || []) as Submission[]);

      const subIds = (subs || []).map((s) => s.id);
      if (subIds.length) {
        const { data: fb } = await supabase
          .from("homework_feedback")
          .select("*")
          .in("submission_id", subIds)
          .order("created_at", { ascending: true });
        setFeedback((fb || []) as Feedback[]);
      } else {
        setFeedback([]);
      }

      const { data: starRow } = await supabase
        .from("homework_stars")
        .select("*")
        .eq("team_slug", teamSlug)
        .order("week_start", { ascending: false })
        .limit(1);
      setStar(starRow?.[0] || null);

      const [questionMap, answerMap] = await Promise.all([
        fetchQuestions((tasksRes.data || []).map((t: any) => t.id)).catch(() => ({})),
        fetchAnswers(subIds).catch(() => ({})),
      ]);
      setQuestionsByTask(questionMap);
      setAnswersBySubmission(answerMap);
    } catch (err: any) {
      console.error("homework load failed", err);
      toast({ title: "Could not load homework", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, teamSlug]);

  useEffect(() => {
    load();
  }, [load]);

  // Signed URLs for the child's proof images and coach drill media.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        submissions
          .filter((s) => s.proof_path && s.proof_type === "image")
          .slice(0, 30)
          .map(async (s) => [s.id, await getHomeworkMediaUrl(s.proof_path)] as const),
      );
      const drillEntries = await Promise.all(
        tasks
          .filter((t) => t.drill_media_path && t.drill_media_type === "image")
          .map(async (t) => [t.id, await getHomeworkMediaUrl(t.drill_media_path)] as const),
      );
      if (cancelled) return;
      setProofUrls(Object.fromEntries(entries.filter(([, v]) => v)));
      setDrillUrls(Object.fromEntries(drillEntries.filter(([, v]) => v)));
    })();
    return () => {
      cancelled = true;
    };
  }, [submissions, tasks]);

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) || children[0] || null,
    [children, selectedChildId],
  );

  const submissionByTask = useMemo(() => {
    const map: Record<string, Submission> = {};
    for (const s of submissions) map[s.task_id] = s;
    return map;
  }, [submissions]);

  const now = Date.now();
  const openTasks = tasks.filter((t) => {
    const s = submissionByTask[t.id];
    if (s) return false;
    if (!t.due_date) return true;
    return new Date(`${t.due_date}T23:59`).getTime() >= now - 14 * DAY_MS;
  });
  const doneTasks = tasks.filter((t) => submissionByTask[t.id]);
  const weekLabel = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" });

  const markDone = async (task: Task, file: File | null) => {
    if (!user || !selectedChild) return;
    const questions = questionsByTask[task.id] || [];
    const drafts = answerDrafts[task.id] || {};
    const missing = missingRequired(questions, drafts);
    if (missing.length) {
      toast({
        title: "Answer the questions first",
        description: `${missing.length} question${missing.length === 1 ? "" : "s"} still need${missing.length === 1 ? "s" : ""} an answer.`,
        variant: "destructive",
      });
      return;
    }
    setUploadingTaskId(task.id);
    try {
      let proof: { path: string; type: "image" | "video" } | null = null;
      if (file) proof = await uploadHomeworkMedia(file, "proof");
      const { data: submission, error } = await supabase
        .from("homework_submissions")
        .insert({
          task_id: task.id,
          player_registration_id: selectedChild.id,
          player_name: selectedChild.name,
          user_id: user.id,
          proof_path: proof?.path ?? null,
          proof_type: proof?.type ?? null,
          note: notes[task.id]?.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (submission?.id && questions.length) {
        await saveAnswers(submission.id, questions, drafts);
      }

      toast({
        title: questions.length ? "Answers sent" : file ? "Homework submitted" : "Marked as done",
        description: file ? "Your photo or video is with the coach." : "Your coach can see this is complete.",
      });
      setNotes((n) => ({ ...n, [task.id]: "" }));
      setAnswerDrafts((d) => ({ ...d, [task.id]: {} }));
      await load();
    } catch (err: any) {
      toast({ title: "Could not submit homework", description: err.message, variant: "destructive" });
    } finally {
      setUploadingTaskId(null);
    }
  };

  const onFilePicked = (task: Task, file: File | null | undefined) => {
    if (!file) return;
    if (file.size > 60 * 1024 * 1024) {
      toast({ title: "File too large", description: "Videos need to be under 60MB.", variant: "destructive" });
      return;
    }
    markDone(task, file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading homework...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Star of the Week */}
      <section className="relative overflow-hidden bg-card border-l-4 border-primary rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Star className="h-6 w-6 text-primary" fill="currentColor" />
          </div>
          <div>
            <p className="text-[10px] font-display uppercase tracking-[0.2em] text-primary">Star of the Week</p>
            {star ? (
              <>
                <h3 className="font-display text-xl font-bold text-foreground mt-1">{star.player_name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Week commencing {formatDate(star.week_start)}{star.citation ? ` - ${star.citation}` : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                No star picked for {teamLabel(teamSlug)} yet this week ({weekLabel}). Keep the homework coming!
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              key={c.id || c.name}
              onClick={() => setSelectedChildId(c.id)}
              className={`px-4 py-2 rounded-sm text-xs font-display uppercase tracking-wider border transition-colors ${
                selectedChild?.name === c.name
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="bg-card border border-border rounded-sm p-10 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No homework set for {teamLabel(teamSlug)} right now.</p>
        </div>
      )}

      {/* Open tasks */}
      {openTasks.length > 0 && (
        <div className="space-y-4">
          {openTasks.map((task) => (
            <article key={task.id} className="bg-card border border-border rounded-sm overflow-hidden">
              <div className="border-l-4 border-primary p-5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-display uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full">
                    To Do
                  </span>
                  {task.due_date && (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Due {formatDate(task.due_date)}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{task.description}</p>
                )}

                {task.drill_media_path && task.drill_media_type === "image" && drillUrls[task.id] && (
                  <img
                    src={drillUrls[task.id]}
                    alt={`${task.title} drill`}
                    className="mt-4 w-full max-w-sm rounded-sm border border-border"
                    loading="lazy"
                  />
                )}
                {task.drill_media_path && task.drill_media_type === "video" && (
                  <DrillVideo path={task.drill_media_path} title={task.title} />
                )}

                <div className="mt-4 space-y-3">
                  <Textarea
                    placeholder="Add a quick note for the coach (optional)"
                    value={notes[task.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [task.id]: e.target.value }))}
                    className="min-h-[60px] text-sm bg-background"
                  />
                  <div className="flex flex-wrap gap-2">
                    <label>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          onFilePicked(task, e.target.files?.[0]);
                          e.currentTarget.value = "";
                        }}
                      />
                      <span
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-sm text-xs font-display uppercase tracking-wider cursor-pointer hover:bg-primary/90"
                        aria-hidden
                      >
                        {uploadingTaskId === task.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        {uploadingTaskId === task.id ? "Uploading..." : "Upload & Mark As Done"}
                      </span>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadingTaskId === task.id}
                      onClick={() => markDone(task, null)}
                      className="text-xs font-display uppercase tracking-wider"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Mark as Done
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Photos and videos up to 60MB. Only coaches can see your child's proof.
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Completed */}
      {doneTasks.length > 0 && (
        <div>
          <h3 className="font-display uppercase tracking-widest text-sm text-muted-foreground mb-3">
            Completed ({doneTasks.length})
          </h3>
          <div className="space-y-3">
            {doneTasks.map((task) => {
              const sub = submissionByTask[task.id];
              const comments = feedback.filter((f) => f.submission_id === sub?.id);
              return (
                <article key={task.id} className="bg-card border border-border rounded-sm p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-display uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Done
                    </span>
                    {sub?.coach_liked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary uppercase tracking-wider">
                        <Heart className="h-3 w-3" fill="currentColor" /> Coach liked this
                      </span>
                    )}
                  </div>
                  <h4 className="font-display font-bold text-foreground">{task.title}</h4>
                  {sub?.completed_at && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Submitted {new Date(sub.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      {sub.player_name ? ` - ${sub.player_name}` : ""}
                    </p>
                  )}
                  {sub?.note && <p className="text-sm text-muted-foreground mt-2 italic">"{sub.note}"</p>}
                  {sub?.proof_path && sub.proof_type === "image" && proofUrls[sub.id] && (
                    <img
                      src={proofUrls[sub.id]}
                      alt="Homework proof"
                      className="mt-3 w-40 rounded-sm border border-border"
                      loading="lazy"
                    />
                  )}
                  {sub?.proof_path && sub.proof_type === "video" && (
                    <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Video className="h-4 w-4 text-primary" /> Video proof uploaded
                    </p>
                  )}
                  {comments.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      {comments.map((c) => (
                        <div key={c.id} className="flex gap-2 text-sm">
                          <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <p className="text-foreground">{c.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {tasks.length > 0 && openTasks.length === 0 && doneTasks.length > 0 && (
        <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Check className="h-4 w-4 text-emerald-500" /> All caught up - great work!
        </p>
      )}
    </div>
  );
}

function DrillVideo({ path, title }: { path: string; title: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getHomeworkMediaUrl(path).then((u) => !cancelled && setUrl(u));
    return () => {
      cancelled = true;
    };
  }, [path]);
  if (!url) return null;
  return <video src={url} controls className="mt-4 w-full max-w-sm rounded-sm border border-border" aria-label={`${title} drill video`} />;
}


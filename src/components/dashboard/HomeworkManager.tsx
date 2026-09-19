import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { uploadHomeworkMedia, getHomeworkMediaUrl, notifyNewHomework, notifyHomeworkFeedback } from "@/lib/homework";
import { CLUB_TEAMS } from "@/lib/teamConfig";
import QuestionBuilder from "@/components/homework/QuestionBuilder";
import {
  HomeworkAnswer, HomeworkQuestion, QuestionDraft, answerText, fetchAnswers, fetchDrafts, fetchQuestions,
  saveQuestions, scoreLabel, validateDrafts,
} from "@/lib/homeworkQuestions";

const teamLabel = (slug: string) => CLUB_TEAMS.find((t) => t.slug === slug)?.name || slug;
import {
  BookOpen, Loader2, Plus, Trash2, Heart, MessageSquare, Star, Pencil, ChevronDown, ChevronRight, Send, Video, ImageIcon,
  Check, X,
} from "lucide-react";

interface Task {
  id: string;
  team_slug: string;
  title: string;
  description: string | null;
  drill_media_path: string | null;
  drill_media_type: string | null;
  due_date: string | null;
  created_by: string | null;
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

interface FeedbackRow {
  id: string;
  submission_id: string;
  coach_id: string;
  comment: string;
  created_at: string;
}

interface StarRow {
  id: string;
  team_slug: string;
  player_registration_id: string | null;
  player_name: string;
  task_id: string | null;
  citation: string | null;
  week_start: string;
}

function startOfWeek(d = new Date()): string {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date.toISOString().slice(0, 10);
}

export default function HomeworkManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [stars, setStars] = useState<StarRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // create form
  const [teamSlug, setTeamSlug] = useState<string>(CLUB_TEAMS[0]?.slug || "u9s-gold");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [drillFile, setDrillFile] = useState<File | null>(null);

  // edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", description: "", due_date: "" });

  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [starDrafts, setStarDrafts] = useState<Record<string, { player: string; citation: string }>>({});
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([]);
  const [editQuestionDrafts, setEditQuestionDrafts] = useState<QuestionDraft[]>([]);
  const [questionsByTask, setQuestionsByTask] = useState<Record<string, HomeworkQuestion[]>>({});
  const [answersBySubmission, setAnswersBySubmission] = useState<Record<string, HomeworkAnswer[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: tasksRes, error: tasksErr } = await supabase
        .from("homework_tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (tasksErr) throw tasksErr;
      setTasks((tasksRes || []) as Task[]);

      const [subsRes, feedbackRes, starsRes] = await Promise.all([
        supabase.from("homework_submissions").select("*").order("completed_at", { ascending: false }),
        supabase.from("homework_feedback").select("*").order("created_at", { ascending: true }),
        supabase.from("homework_stars").select("*").order("week_start", { ascending: false }),
      ]);
      setSubmissions((subsRes.data || []) as Submission[]);
      setFeedback((feedbackRes.data || []) as FeedbackRow[]);
      setStars((starsRes.data || []) as StarRow[]);

      const taskIds = (tasksRes || []).map((t: any) => t.id);
      const submissionIds = (subsRes.data || []).map((s: any) => s.id);
      const [questionMap, answerMap] = await Promise.all([
        fetchQuestions(taskIds).catch(() => ({})),
        fetchAnswers(submissionIds).catch(() => ({})),
      ]);
      setQuestionsByTask(questionMap);
      setAnswersBySubmission(answerMap);
    } catch (err: any) {
      toast({ title: "Could not load homework", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        submissions
          .filter((s) => s.proof_path && s.proof_type === "image")
          .slice(0, 60)
          .map(async (s) => [s.id, await getHomeworkMediaUrl(s.proof_path)] as const),
      );
      if (!cancelled) setProofUrls(Object.fromEntries(entries.filter(([, v]) => v)));
    })();
    return () => {
      cancelled = true;
    };
  }, [submissions]);

  const createTask = async () => {
    if (!title.trim()) {
      toast({ title: "Add a title", variant: "destructive" });
      return;
    }
    const questionProblem = validateDrafts(questionDrafts);
    if (questionProblem) {
      toast({ title: "Check the question sheet", description: questionProblem, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let drill: { path: string; type: "image" | "video" } | null = null;
      if (drillFile) drill = await uploadHomeworkMedia(drillFile, "drill");

      const { data: created, error } = await supabase
        .from("homework_tasks")
        .insert({
          team_slug: teamSlug,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          drill_media_path: drill?.path ?? null,
          drill_media_type: drill?.type ?? null,
          created_by: user?.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (created?.id && questionDrafts.length) {
        await saveQuestions(created.id, questionDrafts);
      }

      setTitle("");
      setDescription("");
      setDueDate("");
      setDrillFile(null);
      setQuestionDrafts([]);
      toast({ title: "Homework set", description: `Notifying the ${teamLabel(teamSlug)} squad...` });
      await notifyNewHomework(
        {
          team_slug: teamSlug,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
        },
        teamLabel(teamSlug),
        questionDrafts.length,
      );
      await load();
      if (created?.id) setExpanded(created.id);
    } catch (err: any) {
      toast({ title: "Could not set homework", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = async (task: Task) => {
    setEditingId(task.id);
    setEditDraft({ title: task.title, description: task.description || "", due_date: task.due_date || "" });
    setEditQuestionDrafts([]);
    try {
      setEditQuestionDrafts(await fetchDrafts(task.id));
    } catch {
      setEditQuestionDrafts([]);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const questionProblem = validateDrafts(editQuestionDrafts);
    if (questionProblem) {
      toast({ title: "Check the question sheet", description: questionProblem, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("homework_tasks")
      .update({
        title: editDraft.title.trim(),
        description: editDraft.description.trim() || null,
        due_date: editDraft.due_date || null,
      })
      .eq("id", editingId);
    if (error) {
      toast({ title: "Could not save changes", description: error.message, variant: "destructive" });
      return;
    }
    try {
      await saveQuestions(editingId, editQuestionDrafts);
    } catch (err: any) {
      toast({ title: "Could not save the questions", description: err.message, variant: "destructive" });
      return;
    }
    setEditingId(null);
    toast({ title: "Homework updated" });
    await load();
  };

  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"? Submissions for it will be removed too.`)) return;
    const { error } = await supabase.from("homework_tasks").delete().eq("id", task.id);
    if (error) {
      toast({ title: "Could not delete homework", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Homework deleted" });
    await load();
  };

  const toggleLike = async (sub: Submission) => {
    const liked = !sub.coach_liked;
    const { error } = await supabase
      .from("homework_submissions")
      .update({ coach_liked: liked })
      .eq("id", sub.id);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    setSubmissions((prev) => prev.map((s) => (s.id === sub.id ? { ...s, coach_liked: liked } : s)));
    if (liked) {
      const task = tasks.find((t) => t.id === sub.task_id);
      const { data: profile } = await supabase.from("profiles").select("email").eq("id", sub.user_id).maybeSingle();
      notifyHomeworkFeedback({
        parentUserId: sub.user_id,
        parentEmail: profile?.email || null,
        playerName: sub.player_name,
        taskTitle: task?.title || "homework",
        message: `Great work on "${task?.title || "homework"}" - your coach gave it a like!`,
        teamSlug: task?.team_slug || "",
      });
    }
  };

  const sendComment = async (sub: Submission) => {
    const comment = (commentDrafts[sub.id] || "").trim();
    if (!comment) return;
    const { data: inserted, error } = await supabase
      .from("homework_feedback")
      .insert({ submission_id: sub.id, coach_id: user?.id, comment })
      .select("id")
      .single();
    if (error || !inserted) {
      toast({ title: "Could not add comment", description: error?.message, variant: "destructive" });
      return;
    }
    setCommentDrafts((d) => ({ ...d, [sub.id]: "" }));
    setFeedback((prev) => [
      ...prev,
      { id: inserted.id, submission_id: sub.id, coach_id: user?.id || "", comment, created_at: new Date().toISOString() },
    ]);
    const task = tasks.find((t) => t.id === sub.task_id);
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", sub.user_id).maybeSingle();
    notifyHomeworkFeedback({
      parentUserId: sub.user_id,
      parentEmail: profile?.email || null,
      playerName: sub.player_name,
      taskTitle: task?.title || "homework",
      message: `New coach feedback on "${task?.title || "homework"}": ${comment}`,
      teamSlug: task?.team_slug || "",
    });
  };

  const setStar = async (task: Task) => {
    const draft = starDrafts[task.id];
    if (!draft?.player?.trim()) {
      toast({ title: "Pick a player first", variant: "destructive" });
      return;
    }
    const week = startOfWeek();
    const sub = submissions.find((s) => s.task_id === task.id && s.player_name === draft.player.trim());
    const { error } = await supabase.from("homework_stars").upsert(
      {
        team_slug: task.team_slug,
        player_registration_id: sub?.player_registration_id ?? null,
        player_name: draft.player.trim(),
        task_id: task.id,
        citation: draft.citation.trim() || null,
        week_start: week,
      },
      { onConflict: "team_slug,week_start" },
    );
    if (error) {
      toast({ title: "Could not set Star of the Week", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${draft.player.trim()} is Star of the Week` });
    if (sub) {
      const { data: profile } = await supabase.from("profiles").select("email").eq("id", sub.user_id).maybeSingle();
      notifyHomeworkFeedback({
        parentUserId: sub.user_id,
        parentEmail: profile?.email || null,
        playerName: sub.player_name,
        taskTitle: task.title,
        message: `${sub.player_name.split(" ")[0]} is the ${teamLabel(task.team_slug)} Homework Star of the Week!${draft.citation.trim() ? ` "${draft.citation.trim()}"` : ""}`,
        teamSlug: task.team_slug,
      });
    }
    await load();
  };

  const submissionsByTask = useCallback(
    (taskId: string) => submissions.filter((s) => s.task_id === taskId),
    [submissions],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading homework...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Set new homework */}
      <section className="bg-card border-l-4 border-primary rounded-sm p-5">
        <h3 className="text-primary font-display uppercase text-lg mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Set Homework
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">Team</label>
            <select
              value={teamSlug}
              onChange={(e) => setTeamSlug(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            >
              {CLUB_TEAMS.map((t) => (
                <option key={t.slug} value={t.slug}>{teamLabel(t.slug)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">Due date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ball Mastery: The Cruyff Turn"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">
              What you want them to practice
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the drill and how many repetitions. This goes to parents by email and push."
              className="min-h-[90px]"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">
              Drill photo or video (optional)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setDrillFile(e.target.files?.[0] || null)}
              className="text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-display file:uppercase file:tracking-wider"
            />
            {drillFile && <p className="text-[10px] text-muted-foreground">{drillFile.name}</p>}
          </div>
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <QuestionBuilder drafts={questionDrafts} onChange={setQuestionDrafts} />
        </div>
        <Button onClick={createTask} disabled={saving} className="mt-4">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
          {saving ? "Setting homework..." : "Set Homework & Notify Team"}
        </Button>
      </section>

      {/* Existing homework */}
      <section>
        <h3 className="font-display uppercase tracking-widest text-sm text-muted-foreground mb-3">
          Homework set ({tasks.length})
        </h3>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card border border-border rounded-sm p-6 text-center">
            No homework set yet. Create your first task above.
          </p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const subs = submissionsByTask(task.id);
              const isOpen = expanded === task.id;
              const starForTeam = stars.find((s) => s.team_slug === task.team_slug);
              const teamSubs = submissions.filter((s) => subs.some((x) => x.id === s.id));
              return (
                <article key={task.id} className="bg-card border border-border rounded-sm overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : task.id)}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4 text-primary shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-foreground truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {teamLabel(task.team_slug)}
                        {task.due_date ? ` - due ${task.due_date}` : ""} - {subs.length} submitted
                      </p>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      className="p-2 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(task);
                      }}
                      aria-label="Edit homework"
                    >
                      <Pencil className="h-4 w-4" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="p-2 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task);
                      }}
                      aria-label="Delete homework"
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  </button>

                  {editingId === task.id && (
                    <div className="border-t border-border bg-muted/30 p-4 space-y-3">
                      <Input value={editDraft.title} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Title" />
                      <Textarea value={editDraft.description} onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Details" className="min-h-[70px]" />
                      <Input type="date" value={editDraft.due_date} onChange={(e) => setEditDraft((d) => ({ ...d, due_date: e.target.value }))} className="w-48" />
                      <QuestionBuilder drafts={editQuestionDrafts} onChange={setEditQuestionDrafts} />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={saveEdit}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {isOpen && (
                    <div className="border-t border-border p-4 space-y-4">
                      {task.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{task.description}</p>}

                      {/* Star of the week for this team */}
                      <div className="bg-primary/5 border border-primary/20 rounded-sm p-3">
                        <p className="text-[10px] font-display uppercase tracking-widest text-primary mb-2 flex items-center gap-1">
                          <Star className="h-3 w-3" fill="currentColor" /> Star of the Week
                          {starForTeam ? ` - current: ${starForTeam.player_name}` : ""}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <select
                            className="bg-background border border-border rounded-md px-2 py-1.5 text-sm"
                            value={starDrafts[task.id]?.player || ""}
                            onChange={(e) =>
                              setStarDrafts((d) => ({
                                ...d,
                                [task.id]: { player: e.target.value, citation: d[task.id]?.citation || "" },
                              }))
                            }
                          >
                            <option value="">Pick a player...</option>
                            {Array.from(new Set(subs.map((s) => s.player_name).filter(Boolean))).map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                          <Input
                            className="flex-1 min-w-[160px]"
                            placeholder="Why they earned it (optional)"
                            value={starDrafts[task.id]?.citation || ""}
                            onChange={(e) =>
                              setStarDrafts((d) => ({
                                ...d,
                                [task.id]: { player: d[task.id]?.player || "", citation: e.target.value },
                              }))
                            }
                          />
                          <Button size="sm" variant="outline" onClick={() => setStar(task)}>
                            <Star className="h-3.5 w-3.5 mr-1" /> Award
                          </Button>
                        </div>
                        {teamSubs.length === 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1">Stars can be picked once submissions come in.</p>
                        )}
                      </div>

                      {/* Submissions */}
                      {subs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No submissions yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {subs.map((sub) => {
                            const comments = feedback.filter((f) => f.submission_id === sub.id);
                            return (
                              <div key={sub.id} className="border border-border rounded-sm p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-bold text-foreground">{sub.player_name || "Player"}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {new Date(sub.completed_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => toggleLike(sub)}
                                    className={`p-2 rounded-full border transition-colors ${sub.coach_liked ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-primary"}`}
                                    aria-label={sub.coach_liked ? "Remove like" : "Like this homework"}
                                  >
                                    <Heart className="h-4 w-4" fill={sub.coach_liked ? "currentColor" : "none"} />
                                  </button>
                                </div>
                                {sub.note && <p className="text-xs text-muted-foreground italic">"{sub.note}"</p>}
                                {(questionsByTask[task.id] || []).length > 0 && (
                                  <div className="border-t border-border pt-2 space-y-1">
                                    {(() => {
                                      const qs = questionsByTask[task.id] || [];
                                      const ans = answersBySubmission[sub.id] || [];
                                      const score = scoreLabel(qs, ans);
                                      return (
                                        <>
                                          <p className="text-[10px] font-display uppercase tracking-widest text-primary">
                                            Answers{score ? ` - scored ${score}` : ""}
                                          </p>
                                          {qs.map((q, qi) => {
                                            const a = ans.find((x) => x.question_id === q.id);
                                            return (
                                              <p key={q.id} className="text-xs text-foreground flex gap-1">
                                                {a?.is_correct === true && <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />}
                                                {a?.is_correct === false && <X className="h-3 w-3 text-destructive mt-0.5 shrink-0" />}
                                                <span>
                                                  <span className="text-muted-foreground">{qi + 1}. {q.prompt} </span>
                                                  {answerText(a?.answer)}
                                                </span>
                                              </p>
                                            );
                                          })}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                                {sub.proof_path && sub.proof_type === "image" && proofUrls[sub.id] && (
                                  <img src={proofUrls[sub.id]} alt={`Proof from ${sub.player_name}`} className="w-32 rounded-sm border border-border" loading="lazy" />
                                )}
                                {sub.proof_path && sub.proof_type === "video" && (
                                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Video className="h-3.5 w-3.5 text-primary" /> Video proof uploaded
                                  </p>
                                )}
                                {comments.length > 0 && (
                                  <div className="space-y-1 border-t border-border pt-2">
                                    {comments.map((c) => (
                                      <p key={c.id} className="text-xs text-foreground flex gap-1">
                                        <MessageSquare className="h-3 w-3 text-primary mt-0.5 shrink-0" /> {c.comment}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Input
                                    className="text-sm"
                                    placeholder="Add a comment for the parent..."
                                    value={commentDrafts[sub.id] || ""}
                                    onChange={(e) => setCommentDrafts((d) => ({ ...d, [sub.id]: e.target.value }))}
                                    onKeyDown={(e) => e.key === "Enter" && sendComment(sub)}
                                  />
                                  <Button size="sm" variant="outline" onClick={() => sendComment(sub)} aria-label="Send comment">
                                    <Send className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

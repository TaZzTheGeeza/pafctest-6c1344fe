import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FAFixture } from "@/hooks/useTeamFixtures";

export function TrainingNotesTab({
  teamSlug, opponent, fixture,
}: {
  teamSlug: string; opponent: string; fixture: FAFixture;
}) {
  const [noteType, setNoteType] = useState("pre-match");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: existingNotes } = useQuery({
    queryKey: ["training-notes", teamSlug, fixture.date, opponent],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_notes")
        .select("*")
        .eq("team_slug", teamSlug)
        .eq("fixture_date", fixture.date)
        .eq("opponent", opponent)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleSave = async () => {
    if (!content.trim()) { toast.error("Add some notes"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("training_notes").insert({
        team_slug: teamSlug,
        fixture_date: fixture.date,
        opponent,
        note_type: noteType,
        content: content.trim(),
      });
      if (error) throw error;
      toast.success("Notes saved!");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["training-notes", teamSlug, fixture.date, opponent] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <Label className="text-xs">Note Type</Label>
        <Select value={noteType} onValueChange={setNoteType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pre-match">Pre-Match</SelectItem>
            <SelectItem value="post-match">Post-Match</SelectItem>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea
          placeholder="Focus areas, tactics, drills to revisit..."
          value={content} onChange={(e) => setContent(e.target.value)} rows={4}
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
        Save Notes
      </Button>

      {existingNotes && existingNotes.length > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs font-display font-semibold text-muted-foreground tracking-wider uppercase">Previous Notes</p>
          {existingNotes.map((note) => (
            <div key={note.id} className="bg-secondary rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-display font-bold text-primary uppercase tracking-wider">
                  {note.note_type}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

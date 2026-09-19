import { supabase } from "@/integrations/supabase/client";

const PUBLIC_SITE_URL = "https://www.pa-fc.uk";

export const HOMEWORK_MAX_VIDEO_BYTES = 60 * 1024 * 1024;

function absoluteNotificationUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${PUBLIC_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Downscale a photo before upload so slow phone connections don't fail. */
export async function compressImage(file: File, maxDim = 1400, quality = 0.85): Promise<Blob | null> {
  try {
    const bitmapUrl = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("decode failed"));
      image.src = bitmapUrl;
    });
    URL.revokeObjectURL(bitmapUrl);

    let { width, height } = img;
    if (!width || !height) return null;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality),
    );
  } catch {
    return null;
  }
}

/**
 * Upload homework proof (photo/video) or coach drill media to the private
 * homework-proof bucket via a short-lived signed upload link.
 */
export async function uploadHomeworkMedia(
  file: File,
  kind: "proof" | "drill" = "proof",
): Promise<{ path: string; type: "image" | "video" }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Your session has expired. Please sign in again.");

  const rawExt = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const isVideo = file.type.startsWith("video/") || ["mp4", "mov", "webm", "m4v", "avi"].includes(rawExt);

  if (isVideo && file.size > HOMEWORK_MAX_VIDEO_BYTES) {
    throw new Error("Videos need to be under 60MB. Try a shorter clip.");
  }

  let uploadBody: Blob = file;
  let uploadType = file.type || (isVideo ? "video/mp4" : "image/jpeg");
  let fileExt = rawExt;

  if (!isVideo) {
    const compressed = await compressImage(file);
    if (compressed) {
      uploadBody = compressed;
      uploadType = "image/jpeg";
      fileExt = "jpg";
    }
  }
  if (!fileExt || fileExt.length > 5) {
    fileExt = (uploadType.split("/")[1] || (isVideo ? "mp4" : "jpg"));
  }

  const { data: uploadLink, error: uploadLinkError } = await supabase.functions.invoke(
    "create-homework-upload",
    { body: { extension: fileExt, kind, sizeBytes: uploadBody.size } },
  );
  if (uploadLinkError || !uploadLink?.path || !uploadLink?.token) {
    throw new Error(uploadLink?.error || "Could not prepare the upload. Please sign in again and retry.");
  }

  const filePath = uploadLink.path as string;
  const { error: uploadError } = await supabase.storage
    .from("homework-proof")
    .uploadToSignedUrl(filePath, uploadLink.token as string, uploadBody, { contentType: uploadType });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}. Please try again.`);

  return { path: filePath, type: isVideo ? "video" : "image" };
}

/** Private bucket - view media through short-lived signed URLs. */
export async function getHomeworkMediaUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("homework-proof").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** New homework set: in-app + push + email to every member of the team. */
export async function notifyNewHomework(task: {
  team_slug: string;
  title: string;
  description: string | null;
  due_date: string | null;
}, teamName: string) {
  const dueLabel = task.due_date
    ? new Date(`${task.due_date}T00:00`).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long",
      })
    : null;

  await notifyTeamMembersSafe({
    teamSlug: task.team_slug,
    notification: {
      title: `New homework: ${task.title}`,
      message: dueLabel
        ? `${teamName} homework set - due ${dueLabel}. Upload your child's proof in the Hub.`
        : `${teamName} homework set. Upload your child's proof in the Hub.`,
      type: "homework",
      link: `/hub?tab=homework&team=${encodeURIComponent(task.team_slug)}`,
    },
    email: {
      templateName: "homework-assigned",
      templateData: {
        title: task.title,
        teamName,
        dueDate: dueLabel,
        message: task.description || "Open the Hub to see the full task and upload your child's proof.",
      },
      idempotencyPrefix: `homework-${task.title.slice(0, 24).replace(/\W+/g, "-").toLowerCase()}`,
    },
    pushTag: `homework-${task.team_slug}`,
  });
}

/** Coach like/comment: in-app + push + email straight to the submitting parent. */
export async function notifyHomeworkFeedback(opts: {
  parentUserId: string;
  parentEmail: string | null;
  playerName: string;
  taskTitle: string;
  message: string;
  teamSlug: string;
}) {
  const link = `/hub?tab=homework&team=${encodeURIComponent(opts.teamSlug)}`;
  const title = `Homework feedback for ${opts.playerName.split(" ")[0]}`;
  try {
    await supabase.from("hub_notifications").insert({
      user_id: opts.parentUserId,
      title,
      message: opts.message,
      type: "homework",
      team_slug: opts.teamSlug,
      link,
    });
  } catch (err) {
    console.error("homework feedback in-app notification failed", err);
  }

  supabase.functions
    .invoke("send-push-notification", {
      body: { userIds: [opts.parentUserId], title, message: opts.message, link, tag: "homework-feedback" },
    })
    .catch((err) => console.error("homework feedback push failed", err));

  if (opts.parentEmail) {
    supabase.functions
      .invoke("send-app-email", {
        body: {
          templateName: "homework-assigned",
          recipientEmail: opts.parentEmail,
          idempotencyKey: `homework-feedback-${opts.parentUserId}-${Date.now()}`,
          templateData: {
            title,
            message: opts.message,
            actionUrl: absoluteNotificationUrl(link),
            ctaLabel: "View Homework",
          },
        },
      })
      .catch((err) => console.error("homework feedback email failed", err));
  }
}

async function notifyTeamMembersSafe(args: {
  teamSlug: string;
  notification: { title: string; message: string; type: string; link?: string };
  email?: { templateName: string; templateData: Record<string, any>; idempotencyPrefix: string };
  pushTag?: string;
}) {
  try {
    const destination = args.notification.link || `/hub?tab=homework&team=${encodeURIComponent(args.teamSlug)}`;
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_slug", args.teamSlug);
    if (!members?.length) return;

    const notifications = members.map((m) => ({
      user_id: m.user_id,
      title: args.notification.title,
      message: args.notification.message,
      type: args.notification.type,
      team_slug: args.teamSlug,
      link: destination,
    }));
    await supabase.from("hub_notifications").insert(notifications);

    const userIds = members.map((m) => m.user_id);
    supabase.functions
      .invoke("send-push-notification", {
        body: {
          userIds,
          title: args.notification.title,
          message: args.notification.message,
          link: destination,
          tag: args.pushTag,
        },
      })
      .catch((err) => console.error("homework push failed", err));

    if (args.email) {
      const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds);
      for (const profile of profiles || []) {
        if (!profile.email) continue;
        supabase.functions
          .invoke("send-app-email", {
            body: {
              templateName: args.email.templateName,
              recipientEmail: profile.email,
              idempotencyKey: `${args.email.idempotencyPrefix}-${profile.id}`,
              templateData: {
                ...args.email.templateData,
                actionUrl: absoluteNotificationUrl(destination),
              },
            },
          })
          .catch((err) => console.error("homework email failed", err));
      }
    }
  } catch (err) {
    console.error("notifyNewHomework error", err);
  }
}

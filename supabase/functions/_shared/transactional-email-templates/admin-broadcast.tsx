export const subject = (data: Record<string, string>) =>
  data.title || "Club Announcement";

export const html = (data: Record<string, string>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .card { background: #141414; border: 1px solid #262626; border-radius: 12px; padding: 32px 24px; }
    .badge { display: inline-block; background: rgba(234,179,8,0.15); color: #eab308; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
    h1 { color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 12px; }
    .message { color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 24px; white-space: pre-line; }
    .btn { display: inline-block; background: #eab308; color: #0a0a0a; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 28px; border-radius: 8px; }
    .footer { text-align: center; margin-top: 24px; color: #525252; font-size: 11px; }
    .footer a { color: #737373; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="badge">📢 Club Announcement</div>
      <h1>${data.title || "Announcement"}</h1>
      <p class="message">${data.message || ""}</p>
      <a href="https://pafc.lovable.app/hub" class="btn">Open Hub</a>
    </div>
    <div class="footer">
      <p>PA FC &bull; Sent from the club</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
`;

const nodemailer = require('nodemailer');

let transporterPromise = null;

const statusLabels = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  QA: 'Review / QA',
  BLOCKED: 'Blockiert',
  DONE: 'Erledigt',
  TODAY: 'Offen',
  THIS_WEEK: 'In Bearbeitung',
  LATER: 'Geplant',
};

const priorityLabels = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return 'Keine Angabe';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Keine Angabe';

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getTaskLink(task) {
  const baseUrl = String(process.env.APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  if (task?.projectId && task?.id) {
    return `${baseUrl}/projects/${encodeURIComponent(task.projectId)}?taskId=${encodeURIComponent(task.id)}`;
  }
  return `${baseUrl}/calendar`;
}

function isEmailNotificationsEnabled() {
  return String(process.env.EMAIL_NOTIFICATIONS_ENABLED || 'false').toLowerCase() === 'true';
}

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM,
  );
}

function canSendEmails() {
  return isEmailNotificationsEnabled() && hasSmtpConfig();
}

function getNotificationRecipient(user) {
  if (!user || user.emailNotificationsEnabled !== true) return null;

  const email = String(user.notificationEmail || user.email || '').trim().toLowerCase();
  if (!email) return null;

  return {
    ...user,
    email,
  };
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
    );
  }

  return transporterPromise;
}

function renderEmailShell({ intro, headline, recipientName, task, projectName, highlightLabel, highlightValue, body, ctaLabel }) {
  const taskLink = getTaskLink(task);
  const dueDate = formatDate(task?.dueDate);
  const startDate = formatDate(task?.startDate);
  const status = statusLabels[task?.status] || task?.status || 'Offen';
  const priority = priorityLabels[task?.priority] || task?.priority || 'Mittel';

  return `
    <div style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#172033;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;margin:0 auto;">
        <tr>
          <td style="padding:0 0 18px 0;">
            <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;font-weight:700;color:#9aa7bf;">NextTask Benachrichtigung</div>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:28px;padding:32px;">
            <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:#fff2f4;color:#b84758;font-size:12px;font-weight:700;">
              ${escapeHtml(intro)}
            </div>
            <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.15;color:#101828;">${escapeHtml(headline)}</h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#526079;">
              Hallo ${escapeHtml(recipientName || 'Teammitglied')}, ${escapeHtml(body)}
            </p>

            <div style="border:1px solid #e2e8f0;border-radius:24px;background:#fcfdff;padding:24px;">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
                <div style="flex:1;min-width:240px;">
                  <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#94a3b8;">Projekt</div>
                  <div style="margin-top:6px;font-size:24px;font-weight:700;color:#0f172a;">${escapeHtml(projectName || 'Ohne Projekt')}</div>
                </div>
                <div style="margin-left:auto;max-width:240px;min-width:180px;padding:12px 14px;border:1px solid #f0d6db;border-radius:20px;background:#fff7f8;text-align:left;">
                  <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;color:#94a3b8;">${escapeHtml(highlightLabel)}</div>
                  <div style="margin-top:6px;font-size:15px;font-weight:700;line-height:1.4;color:#b84758;">${escapeHtml(highlightValue)}</div>
                </div>
              </div>

              <div style="margin-top:24px;padding:18px;border-radius:20px;background:#ffffff;border:1px solid #edf2f7;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#94a3b8;">Aufgabe</div>
                <div style="margin-top:8px;font-size:22px;font-weight:700;color:#0f172a;">${escapeHtml(task?.title || 'Ohne Titel')}</div>
                <div style="margin-top:10px;font-size:15px;line-height:1.7;color:#526079;">${escapeHtml(task?.description || 'Zu dieser Aufgabe wurde keine Beschreibung hinterlegt.')}</div>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">
                <tr>
                  <td style="padding:0 12px 12px 0;vertical-align:top;">
                    <div style="padding:16px;border-radius:18px;background:#ffffff;border:1px solid #edf2f7;">
                      <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;color:#94a3b8;">Start</div>
                      <div style="margin-top:6px;font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(startDate)}</div>
                    </div>
                  </td>
                  <td style="padding:0 0 12px 12px;vertical-align:top;">
                    <div style="padding:16px;border-radius:18px;background:#ffffff;border:1px solid #edf2f7;">
                      <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;color:#94a3b8;">Faelligkeit</div>
                      <div style="margin-top:6px;font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(dueDate)}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 12px 0 0;vertical-align:top;">
                    <div style="padding:16px;border-radius:18px;background:#ffffff;border:1px solid #edf2f7;">
                      <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;color:#94a3b8;">Status</div>
                      <div style="margin-top:6px;font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(status)}</div>
                    </div>
                  </td>
                  <td style="padding:0 0 0 12px;vertical-align:top;">
                    <div style="padding:16px;border-radius:18px;background:#ffffff;border:1px solid #edf2f7;">
                      <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;color:#94a3b8;">Priorität</div>
                      <div style="margin-top:6px;font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(priority)}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <div style="margin-top:28px;">
              <a href="${escapeHtml(taskLink)}" style="display:inline-block;padding:14px 22px;border-radius:16px;background:#b84758;color:#ffffff;text-decoration:none;font-weight:700;">
                ${escapeHtml(ctaLabel)}
              </a>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

async function sendEmail({ to, subject, html, text }) {
  if (!canSendEmails() || !to) return false;

  const transporter = await getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
  return true;
}

async function sendTaskAssignmentEmail({ recipient, task, project, actor, reason }) {
  const resolvedRecipient = getNotificationRecipient(recipient);
  if (!resolvedRecipient?.email || resolvedRecipient.id === actor?.id) return false;

  const subjectPrefix = reason === 'reassigned' ? 'Ticket neu zugewiesen' : 'Neues Ticket für dich';
  const html = renderEmailShell({
    intro: reason === 'reassigned' ? 'Neue Zuweisung' : 'Ticket-Zuweisung',
    headline: reason === 'reassigned' ? 'Ein Ticket wurde dir neu zugewiesen' : 'Dir wurde ein Ticket zugewiesen',
    recipientName: resolvedRecipient.name,
    task,
    projectName: project?.name,
    highlightLabel: 'Zugewiesen von',
    highlightValue: actor?.name || actor?.email || 'NextTask',
    body:
      reason === 'reassigned'
        ? 'du bist jetzt für dieses Ticket verantwortlich. In der Uebersicht unten siehst du sofort Projekt, Status, Priorität und Faelligkeit.'
        : 'du wurdest für dieses Ticket eingetragen. In der Uebersicht unten siehst du sofort Projekt, Status, Priorität und Faelligkeit.',
    ctaLabel: 'Ticket ansehen',
  });

  const text = [
    `${subjectPrefix}: ${task.title}`,
    `Projekt: ${project?.name || 'Ohne Projekt'}`,
    `Zugewiesen von: ${actor?.name || actor?.email || 'NextTask'}`,
    `Faelligkeit: ${formatDate(task?.dueDate)}`,
    `Status: ${statusLabels[task?.status] || task?.status || 'Offen'}`,
    `Priorität: ${priorityLabels[task?.priority] || task?.priority || 'Mittel'}`,
    '',
    task?.description || 'Keine Beschreibung vorhanden.',
    '',
    getTaskLink(task),
  ].join('\n');

  return sendEmail({
    to: resolvedRecipient.email,
    subject: `${subjectPrefix}: ${task.title}`,
    html,
    text,
  });
}

async function sendTaskMentionEmail({ recipient, task, project, actor, commentContent }) {
  const resolvedRecipient = getNotificationRecipient(recipient);
  if (!resolvedRecipient?.email || resolvedRecipient.id === actor?.id) return false;

  const html = renderEmailShell({
    intro: 'Neue Erwaehnung',
    headline: 'Du wurdest in einem Ticket erwaehnt',
    recipientName: resolvedRecipient.name,
    task,
    projectName: project?.name,
    highlightLabel: 'Kommentar von',
    highlightValue: actor?.name || actor?.email || 'NextTask',
    body: 'jemand hat dich in einem Kommentar erwaehnt. Unten findest du die Ticketdaten und den Kommentartext auf einen Blick.',
    ctaLabel: 'Ticket ansehen',
  });

  const commentPreview = String(commentContent || '').trim() || 'Kein Kommentartext vorhanden.';
  const text = [
    `Du wurdest in einem Ticket erwaehnt: ${task.title}`,
    `Projekt: ${project?.name || 'Ohne Projekt'}`,
    `Kommentar von: ${actor?.name || actor?.email || 'NextTask'}`,
    '',
    `Kommentar: ${commentPreview}`,
    '',
    getTaskLink(task),
  ].join('\n');

  return sendEmail({
    to: resolvedRecipient.email,
    subject: `Erwaehnung in Ticket: ${task.title}`,
    html: html.replace(
      '</div>\n            </div>\n\n            <div style="margin-top:28px;">',
      `<div style="margin-top:18px;padding:18px;border-radius:20px;background:#ffffff;border:1px solid #edf2f7;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#94a3b8;">Kommentar</div>
                <div style="margin-top:8px;font-size:15px;line-height:1.7;color:#526079;">${escapeHtml(commentPreview)}</div>
              </div>
            </div>

            <div style="margin-top:28px;">`,
    ),
    text,
  });
}

async function sendNotificationTestEmail({ recipient }) {
  const resolvedRecipient = getNotificationRecipient(recipient);
  if (!resolvedRecipient?.email) return false;

  const html = renderEmailShell({
    intro: 'Testversand',
    headline: 'Deine NextTask Mail-Benachrichtigungen funktionieren',
    recipientName: resolvedRecipient.name,
    task: {
      title: 'Testbenachrichtigung',
      description: 'Diese Mail wurde aus den Einstellungen versendet, damit du das Layout und den Versand pruefen kannst.',
      startDate: new Date(),
      dueDate: new Date(),
      status: 'OPEN',
      priority: 'MEDIUM',
    },
    projectName: 'NextTask Einstellungen',
    highlightLabel: 'Benachrichtigungsadresse',
    highlightValue: resolvedRecipient.email,
    body: 'dies ist eine Testmail. Wenn du sie siehst, ist deine Benachrichtigungsadresse korrekt hinterlegt und der Versand funktioniert.',
    ctaLabel: 'Einstellungen in NextTask ansehen',
  });

  const text = [
    'NextTask Testmail',
    `Benachrichtigungsadresse: ${resolvedRecipient.email}`,
    'Diese Mail wurde aus den Einstellungen versendet.',
    '',
    `${String(process.env.APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '')}/settings`,
  ].join('\n');

  return sendEmail({
    to: resolvedRecipient.email,
    subject: 'NextTask Testmail',
    html,
    text,
  });
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractMentionedUsers(content, users) {
  const text = String(content || '');
  if (!text.trim()) return [];

  return users.filter((user) => {
    if (!user?.name) return false;
    const mentionPattern = new RegExp(`(^|\\s)@${escapeRegExp(user.name)}(?=\\s|$)`, 'i');
    return mentionPattern.test(text);
  });
}

module.exports = {
  canSendEmails,
  extractMentionedUsers,
  getNotificationRecipient,
  sendNotificationTestEmail,
  sendTaskAssignmentEmail,
  sendTaskMentionEmail,
};

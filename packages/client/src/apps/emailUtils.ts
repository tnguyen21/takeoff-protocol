/**
 * Pure utility functions for EmailApp folder management and email filtering.
 *
 * Exported for unit testing without a DOM environment.
 */

export type EmailFolder = "inbox" | "sent" | "drafts" | "starred" | "archive" | "spam";

export const EMAIL_FOLDERS: EmailFolder[] = ["inbox", "sent", "drafts", "starred", "archive", "spam"];

export interface EmailItem {
  from: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred?: boolean;
  /** Folder the email belongs to; defaults to "inbox" when omitted. */
  folder?: "inbox" | "sent" | "drafts" | "archive" | "spam";
  attachment?: boolean;
  body?: string;
  classification?: "critical" | "red-herring" | "breadcrumb" | "context";
}

/**
 * Returns true if an email belongs to the given folder.
 * "starred" is a virtual folder: any starred email appears there regardless of its folder field.
 * All other folders match the email's `folder` field (defaulting to "inbox").
 */
export function emailBelongsToFolder(email: EmailItem, folder: EmailFolder): boolean {
  if (folder === "starred") return email.starred === true;
  return (email.folder ?? "inbox") === folder;
}

/**
 * Filters emails to those belonging to a folder.
 */
export function filterEmailsByFolder(emails: EmailItem[], folder: EmailFolder): EmailItem[] {
  return emails.filter((e) => emailBelongsToFolder(e, folder));
}

/**
 * Computes per-folder unread counts across all provided emails.
 * "starred" counts unread starred emails.
 */
export function computeFolderUnreadCounts(emails: EmailItem[]): Record<EmailFolder, number> {
  const counts = {} as Record<EmailFolder, number>;
  for (const folder of EMAIL_FOLDERS) {
    counts[folder] = filterEmailsByFolder(emails, folder).filter((e) => !e.read).length;
  }
  return counts;
}

/**
 * Filters emails by a search query, matching against subject, sender, and body/preview.
 * Returns all emails when query is empty.
 */
export function filterEmailsBySearch(emails: EmailItem[], query: string): EmailItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return emails;
  return emails.filter(
    (e) =>
      e.subject.toLowerCase().includes(q) ||
      e.from.toLowerCase().includes(q) ||
      (e.body ?? e.preview).toLowerCase().includes(q)
  );
}

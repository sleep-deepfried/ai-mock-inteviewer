import { google } from "googleapis";

const MAX_COMMENT_LEN = 8000;

/**
 * Avoid formula injection in Sheets (leading =, +, -, @).
 */
export function sanitizeForSheetCell(value: string): string {
  const t = value.trim();
  if (t.length === 0) return "";
  const clipped = t.length > MAX_COMMENT_LEN ? t.slice(0, MAX_COMMENT_LEN) : t;
  if (/^[=+\-@]/.test(clipped)) return `'${clipped}`;
  return clipped;
}

export interface InterviewReviewSheetRow {
  userEmail: string;
  userId: string;
  rating: number;
  comment: string;
  jobRole: string;
  durationSec: number;
}

/**
 * Appends one row to the configured spreadsheet (tab "Reviews" by default).
 * No-ops with a console warning if env is not configured (local dev without Sheets).
 *
 * Env:
 * - `GOOGLE_SHEETS_SPREADSHEET_ID` — spreadsheet id from the URL
 * - `GOOGLE_SERVICE_ACCOUNT_JSON` — full service account key JSON (string)
 * - `GOOGLE_SHEETS_TAB_NAME` — optional tab name (default `Reviews`)
 */
export async function appendInterviewReviewRow(
  params: InterviewReviewSheetRow,
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const jsonCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();

  if (!spreadsheetId || !jsonCredentials) {
    console.warn(
      "[sheets] GOOGLE_SHEETS_SPREADSHEET_ID or GOOGLE_SERVICE_ACCOUNT_JSON missing; skipping review append",
    );
    return;
  }

  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(jsonCredentials) as {
      client_email?: string;
      private_key?: string;
    };
  } catch {
    console.error("[sheets] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    return;
  }

  if (!credentials.client_email || !credentials.private_key) {
    console.error(
      "[sheets] GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key",
    );
    return;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const tab = process.env.GOOGLE_SHEETS_TAB_NAME?.trim() || "Reviews";

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tab}!A:G`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          params.userEmail,
          params.userId,
          params.rating,
          sanitizeForSheetCell(params.comment),
          params.jobRole,
          Math.round(params.durationSec),
        ],
      ],
    },
  });
}

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Interview feedback (Google Sheets)

When a user submits a star rating after an interview, the API can append a row to a Google Sheet.

1. In [Google Cloud Console](https://console.cloud.google.com/), enable **Google Sheets API** for your project.
2. Create a **service account**, then add a JSON key. Copy the entire JSON object.
3. Create a Google Sheet and **share** it with the service account email (role: **Editor**).
4. Copy the spreadsheet ID from the URL (`https://docs.google.com/spreadsheets/d/`**`SPREADSHEET_ID`**`/edit`).
5. Add a worksheet named **`Reviews`** (or set `GOOGLE_SHEETS_TAB_NAME`), optionally with a header row:

   | Timestamp | User email | User id | Rating | Comment | Job role | Duration (s) |

6. Set environment variables (e.g. in `.env.local`):

   - `GOOGLE_SHEETS_SPREADSHEET_ID` — the spreadsheet ID
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — single-line JSON string of the service account key (in hosted envs, paste the minified JSON or use a secret manager)
   - `GOOGLE_SHEETS_TAB_NAME` — optional; defaults to `Reviews`

If these variables are missing, reviews are skipped and the app still returns interview results.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

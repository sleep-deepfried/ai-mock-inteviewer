const MIME_PDF = "application/pdf";
const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Extract plain text from a PDF or DOCX resume buffer.
 * Throws a descriptive Error for unsupported types, corrupt files, or empty text.
 */
export async function parseResume(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType !== MIME_PDF && mimeType !== MIME_DOCX) {
    throw new Error(
      `Unsupported file type: ${mimeType}. Only PDF and DOCX files are accepted.`
    );
  }

  let text: string;

  if (mimeType === MIME_PDF) {
    text = await parsePdf(buffer);
  } else {
    text = await parseDocx(buffer);
  }

  if (!text.trim()) {
    throw new Error("Resume file contains no extractable text.");
  }

  return text;
}

async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const pdf = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await pdf.getText();
    return result.text;
  } catch (err) {
    throw new Error(
      `Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (err) {
    throw new Error(
      `Failed to parse DOCX: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

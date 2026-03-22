/**
 * Client-side file validation utility.
 * Validates that uploaded files are PDF or DOCX and under 5MB.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

export function isValidFile(file: File): { valid: boolean; error?: string } {
  const name = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    name.endsWith(ext)
  );

  if (!hasValidExtension) {
    return { valid: false, error: "Only PDF and DOCX files are accepted" };
  }

  if (file.size >= MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be under 5MB" };
  }

  return { valid: true };
}

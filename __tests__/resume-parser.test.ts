import { describe, it, expect } from "vitest";
import { parseResume } from "@/lib/resume-parser";
import fs from "fs";
import path from "path";

// Helper to create a minimal valid PDF with text content
function createMinimalPdf(text: string): Buffer {
  // Minimal valid PDF 1.0 with a single page containing text
  const content = `1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length ${20 + text.length} >>
stream
BT /F1 12 Tf 100 700 Td (${text}) Tj ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
`;
  const xrefOffset = content.lastIndexOf("xref");
  const fullPdf = `%PDF-1.0
${content}${xrefOffset + 10} 00000 n 

trailer
<< /Size 6 /Root 1 0 R >>
startxref
${xrefOffset + 10}
%%EOF`;
  return Buffer.from(fullPdf, "ascii");
}

describe("Resume parser unit tests", () => {
  describe("PDF extraction", () => {
    it("extracts text from a valid PDF file", async () => {
      // Use a fixture PDF if available, otherwise create a minimal one
      const fixturePath = path.join(__dirname, "fixtures", "sample.pdf");
      let buffer: Buffer;

      if (fs.existsSync(fixturePath)) {
        buffer = fs.readFileSync(fixturePath);
      } else {
        buffer = createMinimalPdf("Software Engineer Resume");
      }

      const text = await parseResume(buffer, "application/pdf");
      expect(text).toBeTruthy();
      expect(text.trim().length).toBeGreaterThan(0);
    });

    it("throws descriptive error for corrupt PDF", async () => {
      const corruptBuffer = Buffer.from("not a real pdf file");
      await expect(
        parseResume(corruptBuffer, "application/pdf")
      ).rejects.toThrow(/Failed to parse PDF/);
    });
  });

  describe("DOCX extraction", () => {
    it("extracts text from a valid DOCX file", async () => {
      const fixturePath = path.join(__dirname, "fixtures", "sample.docx");

      if (!fs.existsSync(fixturePath)) {
        // Create a minimal DOCX using mammoth's expected format (ZIP with XML)
        // We'll use jszip to create a minimal valid DOCX
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();

        // Minimal DOCX structure
        zip.file(
          "[Content_Types].xml",
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
            "</Types>"
        );

        zip.file(
          "_rels/.rels",
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
            "</Relationships>"
        );

        zip.file(
          "word/_rels/document.xml.rels",
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            "</Relationships>"
        );

        zip.file(
          "word/document.xml",
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            "<w:body>" +
            "<w:p><w:r><w:t>Senior Developer with 10 years experience</w:t></w:r></w:p>" +
            "</w:body>" +
            "</w:document>"
        );

        const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });
        const text = await parseResume(
          docxBuffer,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        expect(text).toContain("Senior Developer");
        expect(text).toContain("10 years experience");
        return;
      }

      const buffer = fs.readFileSync(fixturePath);
      const text = await parseResume(
        buffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      expect(text).toBeTruthy();
      expect(text.trim().length).toBeGreaterThan(0);
    });

    it("throws descriptive error for corrupt DOCX", async () => {
      const corruptBuffer = Buffer.from("not a real docx file");
      await expect(
        parseResume(
          corruptBuffer,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      ).rejects.toThrow(/Failed to parse DOCX/);
    });
  });

  describe("unsupported types", () => {
    it("throws for unsupported MIME type", async () => {
      const buffer = Buffer.from("some content");
      await expect(parseResume(buffer, "text/plain")).rejects.toThrow(
        /Unsupported file type/
      );
    });

    it("throws for image MIME type", async () => {
      const buffer = Buffer.from("fake image");
      await expect(parseResume(buffer, "image/png")).rejects.toThrow(
        /Unsupported file type/
      );
    });
  });
});

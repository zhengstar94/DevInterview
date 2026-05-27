export interface ParsedResume {
  fileName: string;
  uploadTime: string;
  text: string;
}

export async function parsePDF(file: File): Promise<string> {
  // Dynamically import pdfjs-dist only on client side
  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText.trim();
}

export function saveResumeToStorage(data: ParsedResume): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("resume_data", JSON.stringify(data));
}

export function getResumeFromStorage(): ParsedResume | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("resume_data");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearResumeFromStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("resume_data");
}
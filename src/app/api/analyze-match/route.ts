import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

interface MatchItem {
  item: string;
  status: "matched" | "missing" | "partial";
  en: string;
  cn: string;
}

interface AnalysisResult {
  score: number;
  matched: MatchItem[];
  missing: MatchItem[];
  partial: MatchItem[];
}

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jdText } = await request.json();

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }

    if (!jdText || typeof jdText !== "string" || jdText.trim().length === 0) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({
      apiKey,
      baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
    });

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a resume-job description matching analyzer. Analyze the resume against the job description and provide a detailed matching analysis.

**Step 1: Parse both documents**
Extract key requirements from the JD and map them against the resume.

**Step 2: Analyze match**
For each requirement in the JD, determine if the resume demonstrates:
- "matched": Resume clearly satisfies this requirement
- "missing": Resume does not mention this skill/requirement
- "partial": Resume mentions but not at the required level

**Output Format (JSON only, no other text)**:
{
  "score": [0-100 number],
  "matched": [
    {
      "item": "[requirement name]",
      "status": "matched",
      "en": "[English explanation]",
      "cn": "[中文解释]"
    }
  ],
  "missing": [
    {
      "item": "[requirement name]",
      "status": "missing",
      "en": "[English explanation]",
      "cn": "[中文解释]"
    }
  ],
  "partial": [
    {
      "item": "[requirement name]",
      "status": "partial",
      "en": "[English explanation]",
      "cn": "[中文解释]"
    }
  ]
}

**Important**:
- Score should reflect overall match percentage (0-100)
- Include 3-5 items in each category
- All explanations must be bilingual (en + cn)

Job Description:
${jdText}

Resume:
${resumeText}`,
        },
      ],
    });

    const textContent = message.content.find((item) => item.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in AI response");
    }

    const text = textContent.text;
    console.log("AI Response text:", text);

    // Try to find JSON object in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis from AI response");
    }

    let result: AnalysisResult;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      throw new Error("Invalid JSON format from AI: " + (parseError instanceof Error ? parseError.message : "parse error"));
    }

    if (typeof result.score !== "number") {
      throw new Error("Invalid analysis format from AI");
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Analyze match API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze match";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
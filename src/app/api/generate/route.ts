import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

interface Question {
  category: string;
  tech: string;
  q: string;
  ask: string;
  a: string;
  answer: string;
}

export async function POST(request: NextRequest) {
  try {
    const { jd } = await request.json();

    if (!jd || typeof jd !== "string" || jd.trim().length === 0) {
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
          content: `You are a technical interview question generator. Process the job description (JD) in two steps:

**Step 1: Parse the JD**
Based on the job description below, extract and summarize:
- Core Tech Stack (核心技术栈): Technologies explicitly required and central to the role → Generate 3 questions from these
- Secondary Tech (次要技术): Technologies mentioned as nice-to-have or briefly mentioned → Generate 2 questions from these
- Industry Background (行业背景): Finance, E-commerce, Enterprise Software, etc.
- Years Requirement (年限要求): Experience level requested

**Step 2: Generate Questions**
Based on the parsed information:
- Generate exactly 3 questions from CORE tech stack
- Generate exactly 2 questions from SECONDARY tech
- ONLY generate questions about technologies explicitly mentioned in the JD
- Questions should be specific to THIS job, not generic interview questions
- All questions and answers MUST be bilingual (English + Chinese)

**Output Format (JSON array only, no other text)**:
[
  {
    "category": "Core Tech / Secondary Tech",
    "tech": "The specific technology this question is about",
    "q": "English question",
    "ask": "中文问题",
    "a": "English answer (concise, 2-4 sentences)",
    "answer": "中文答案（简洁，2-4句）"
  }
]

Job Description:
${jd}`,
        },
      ],
    });

    const textContent = message.content.find((item) => item.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in AI response");
    }

    const text = textContent.text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse questions from AI response");
    }

    const questions: Question[] = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(questions) || questions.length !== 5) {
      throw new Error("Expected exactly 5 questions (3 Core Tech + 2 Secondary Tech)");
    }

    const coreTechCount = questions.filter(q => q.category === "Core Tech").length;
    const secondaryTechCount = questions.filter(q => q.category === "Secondary Tech").length;

    if (coreTechCount !== 3 || secondaryTechCount !== 2) {
      throw new Error(`Expected 3 Core Tech + 2 Secondary Tech questions, got ${coreTechCount} Core + ${secondaryTechCount} Secondary`);
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Generate API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate questions";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
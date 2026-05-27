# DevInterview

AI-powered Technical Interview Question Generator for Overseas Job Seekers

## About

DevInterview helps overseas technical job seekers quickly generate targeted interview questions. Simply paste a job description (JD), and get customized bilingual interview Q&A.

## Features

- **Smart JD Parsing**: Automatically extracts core tech stack, secondary tech, industry background, and experience requirements
- **Targeted Questions**: Generate questions based on JD analysis, no generic questions
  - Core Tech Stack: 3 questions
  - Secondary Tech: 2 questions
- **Bilingual Format**: Questions and answers in English + Chinese
- **Resume Matching Analysis**: Upload PDF resume for JD match analysis
  - Match score (0-100%)
  - Matched / Partial Match / Missing skills grouped display
- **Clean UI**: Single page application, desktop-focused

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Anthropic AI SDK
- pdfjs-dist for PDF parsing

## Prerequisites

- Node.js 18+
- Anthropic API Key

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` file with your API credentials:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your API key:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Required |
| `ANTHROPIC_BASE_URL` | API endpoint | https://api.anthropic.com |
| `ANTHROPIC_MODEL` | Model to use | claude-sonnet-4-20250514 |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze-match/
│   │   │   └── route.ts    # Resume matching API
│   │   └── generate/
│   │       └── route.ts    # Question generation API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Main page with tabs
├── lib/
│   └── pdf.ts             # PDF parsing utilities
├── .env.example           # Environment template
├── .env.local             # Local environment (gitignored)
└── .gitignore
```

## License

MIT
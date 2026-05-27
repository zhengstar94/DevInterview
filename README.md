# DevInterview

海外技术面试题库生成器 - 基于 AI 的智能面试题生成工具

## About

DevInterview 帮助海外技术求职者快速生成针对性的面试题目。只需粘贴职位描述 (JD)，即可获得定制的双语面试问答。

## Features

- **智能解析 JD**: 自动提取核心技术栈、次要技术、行业背景和年限要求
- **针对性出题**: 基于 JD 解析结果生成题目，不出通用题
  - 核心技术栈: 3 道题
  - 次要技术: 2 道题
- **双语格式**: 题目和答案均为英文+中文
- **简历匹配分析**: 上传 PDF 简历，与 JD 进行匹配度分析
  - 匹配度评分 (0-100%)
  - 已满足 / 部分匹配 / 缺少技能 分组展示
- **简洁界面**: 单页应用，桌面端为主

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Anthropic AI SDK

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
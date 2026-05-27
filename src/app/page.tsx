"use client";

import { useState, useEffect } from "react";
import { parsePDF, saveResumeToStorage, getResumeFromStorage, clearResumeFromStorage, ParsedResume } from "@/lib/pdf";

// Types for Question Generation
interface Question {
  category: string;
  tech: string;
  q: string;
  ask: string;
  a: string;
  answer: string;
}

// Types for Resume Matching
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

// Types for History
interface HistoryRecord {
  id: string;
  type: "questions" | "analysis";
  date: string;
  jd: string;
  result: string;
}

type Tab = "questions" | "resume" | "history";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("questions");
  const [jd, setJd] = useState("");

  // Question Generation State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [errorQuestions, setErrorQuestions] = useState("");

  // Resume Matching State
  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [parsing, setParsing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorAnalysis, setErrorAnalysis] = useState("");

  // History State
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load resume from localStorage on mount
  useEffect(() => {
    const saved = getResumeFromStorage();
    if (saved) {
      setResume(saved);
    }
  }, []);

  // Load history when tab is opened
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      if (response.ok) {
        setHistory(data.records || []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveToHistory = async (type: "questions" | "analysis", result: string) => {
    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, jd, result }),
      });
    } catch (err) {
      console.error("Failed to save to history:", err);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const response = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        setHistory(history.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete history:", err);
    }
  };

  const clearAllHistory = async () => {
    for (const item of history) {
      await fetch(`/api/history?id=${item.id}`, { method: "DELETE" });
    }
    setHistory([]);
  };

  // Handle PDF Upload
  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorAnalysis("Please upload a PDF file");
      return;
    }

    setParsing(true);
    setErrorAnalysis("");

    try {
      const text = await parsePDF(file);
      const resumeData: ParsedResume = {
        fileName: file.name,
        uploadTime: new Date().toLocaleString(),
        text,
      };
      saveResumeToStorage(resumeData);
      setResume(resumeData);
    } catch (err) {
      setErrorAnalysis(err instanceof Error ? err.message : "Failed to parse PDF");
    } finally {
      setParsing(false);
    }
  };

  // Handle Resume Analysis
  const handleAnalyze = async () => {
    if (!resume) {
      setErrorAnalysis("Please upload a resume first");
      return;
    }
    if (!jd.trim()) {
      setErrorAnalysis("Please paste a job description first");
      return;
    }

    setLoadingAnalysis(true);
    setErrorAnalysis("");
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resume.text, jdText: jd }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze match");
      }

      setAnalysisResult(data.result);
      await saveToHistory("analysis", JSON.stringify(data.result));
    } catch (err) {
      setErrorAnalysis(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Handle Question Generation
  const handleGenerate = async () => {
    if (!jd.trim()) {
      setErrorQuestions("Please paste a job description first.");
      return;
    }

    setLoadingQuestions(true);
    setErrorQuestions("");
    setQuestions([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate questions");
      }

      setQuestions(data.questions);
      await saveToHistory("questions", JSON.stringify(data.questions));
    } catch (err) {
      setErrorQuestions(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleChangeResume = () => {
    clearResumeFromStorage();
    setResume(null);
    setAnalysisResult(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-black">
          DevInterview / 海外技术面试助手
        </h1>

        {/* Tab Switcher */}
        <div className="mb-8 flex rounded-lg bg-zinc-200 p-1">
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "questions"
                ? "bg-white text-black shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            技术题生成
          </button>
          <button
            onClick={() => setActiveTab("resume")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "resume"
                ? "bg-white text-black shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            简历匹配分析
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-white text-black shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            历史记录
          </button>
        </div>

        {/* JD Input - Shared */}
        <div className="mb-8">
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Paste Job Description (粘贴 JD)
          </label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description here..."
            className="h-48 w-full resize-y rounded-lg border border-zinc-300 p-4 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {/* Content based on active tab */}
        {activeTab === "questions" ? (
          <>
            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loadingQuestions}
              className="mb-8 w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:bg-zinc-400"
            >
              {loadingQuestions ? "Generating..." : "Generate Questions / 生成题目"}
            </button>

            {/* Error Message */}
            {errorQuestions && (
              <div className="mb-8 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {errorQuestions}
              </div>
            )}

            {/* Questions Output */}
            {questions.length > 0 && (
              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-zinc-200 bg-white p-6"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          q.category === "Core Tech"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {q.category}
                      </span>
                      <span className="text-xs font-medium text-zinc-500">
                        {q.tech}
                      </span>
                    </div>
                    <div className="mb-4">
                      <span className="font-semibold text-zinc-900">Q: </span>
                      <span className="text-zinc-700">{q.q}</span>
                    </div>
                    <div className="mb-4">
                      <span className="font-semibold text-zinc-900">问: </span>
                      <span className="text-zinc-700">{q.ask}</span>
                    </div>
                    <div className="mb-4">
                      <span className="font-semibold text-zinc-900">A: </span>
                      <span className="text-zinc-700">{q.a}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-900">答: </span>
                      <span className="text-zinc-700">{q.answer}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === "resume" ? (
          <>
            {/* Resume Upload Section */}
            <div className="mb-8">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Resume / 简历
              </label>
              {resume ? (
                <div className="rounded-lg border border-zinc-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900">{resume.fileName}</p>
                      <p className="text-sm text-zinc-500">{resume.uploadTime}</p>
                    </div>
                    <button
                      onClick={handleChangeResume}
                      className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      更换简历
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-white hover:border-zinc-400">
                  <div className="flex flex-col items-center text-zinc-500">
                    {parsing ? (
                      <span>Parsing PDF...</span>
                    ) : (
                      <>
                        <span className="mb-2 text-lg font-medium">
                          Upload PDF Resume / 上传 PDF 简历
                        </span>
                        <span className="text-sm">Click to select file</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUploadResume}
                    className="hidden"
                    disabled={parsing}
                  />
                </label>
              )}
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loadingAnalysis || !resume}
              className="mb-8 w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:bg-zinc-400"
            >
              {loadingAnalysis ? "Analyzing..." : "Analyze Match / 分析匹配"}
            </button>

            {/* Error Message */}
            {errorAnalysis && (
              <div className="mb-8 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {errorAnalysis}
              </div>
            )}

            {/* Analysis Result */}
            {analysisResult && (
              <div className="space-y-6">
                {/* Score */}
                <div className="rounded-lg border border-zinc-200 bg-white p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-zinc-900">
                      Match Score / 匹配度
                    </span>
                    <span className="text-2xl font-bold text-black">
                      {analysisResult.score}%
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full rounded-full bg-black transition-all"
                      style={{ width: `${analysisResult.score}%` }}
                    />
                  </div>
                </div>

                {/* Matched */}
                {analysisResult.matched.length > 0 && (
                  <div className="rounded-lg border border-zinc-200 bg-white p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-green-700">
                      <span>✓</span> Matched / 已满足
                    </h3>
                    <div className="space-y-4">
                      {analysisResult.matched.map((item, index) => (
                        <div key={index} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                          <p className="font-medium text-zinc-900">{item.item}</p>
                          <p className="text-sm text-zinc-600">{item.en}</p>
                          <p className="text-sm text-zinc-500">{item.cn}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Partial */}
                {analysisResult.partial.length > 0 && (
                  <div className="rounded-lg border border-zinc-200 bg-white p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-yellow-700">
                      <span>⚠</span> Partial Match / 部分匹配
                    </h3>
                    <div className="space-y-4">
                      {analysisResult.partial.map((item, index) => (
                        <div key={index} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                          <p className="font-medium text-zinc-900">{item.item}</p>
                          <p className="text-sm text-zinc-600">{item.en}</p>
                          <p className="text-sm text-zinc-500">{item.cn}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing */}
                {analysisResult.missing.length > 0 && (
                  <div className="rounded-lg border border-zinc-200 bg-white p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-red-700">
                      <span>✗</span> Missing / 缺少技能
                    </h3>
                    <div className="space-y-4">
                      {analysisResult.missing.map((item, index) => (
                        <div key={index} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                          <p className="font-medium text-zinc-900">{item.item}</p>
                          <p className="text-sm text-zinc-600">{item.en}</p>
                          <p className="text-sm text-zinc-500">{item.cn}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* History Tab */}
            {history.length > 0 && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={clearAllHistory}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  清空全部
                </button>
              </div>
            )}

            {loadingHistory ? (
              <div className="text-center text-zinc-500 py-8">Loading...</div>
            ) : history.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">No history yet / 暂无历史记录</div>
            ) : (
              <div className="space-y-4">
                {history.map((record) => (
                  <div key={record.id} className="rounded-lg border border-zinc-200 bg-white">
                    <div
                      className="flex cursor-pointer items-center justify-between p-4"
                      onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            record.type === "questions"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {record.type === "questions" ? "技术题" : "匹配分析"}
                        </span>
                        <span className="text-sm text-zinc-500">
                          {formatDate(record.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400">
                          {expandedId === record.id ? "▲" : "▼"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(record.id);
                          }}
                          className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-zinc-100 px-4 py-2 text-sm text-zinc-600">
                      JD: {record.jd.substring(0, 100)}{record.jd.length > 100 ? "..." : ""}
                    </div>
                    {expandedId === record.id && (
                      <div className="border-t border-zinc-100 p-4">
                        {record.type === "questions" ? (
                          <div className="space-y-6">
                            {JSON.parse(record.result).map((q: Question, idx: number) => (
                              <div key={idx} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                <div className="mb-2 flex items-center gap-2">
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                                    q.category === "Core Tech" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                  }`}>{q.category}</span>
                                  <span className="text-xs font-medium text-zinc-500">{q.tech}</span>
                                </div>
                                <div className="mb-2"><span className="font-semibold text-zinc-900">Q: </span><span className="text-zinc-700">{q.q}</span></div>
                                <div className="mb-2"><span className="font-semibold text-zinc-900">问: </span><span className="text-zinc-700">{q.ask}</span></div>
                                <div className="mb-2"><span className="font-semibold text-zinc-900">A: </span><span className="text-zinc-700">{q.a}</span></div>
                                <div><span className="font-semibold text-zinc-900">答: </span><span className="text-zinc-700">{q.answer}</span></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {(() => {
                              const result = JSON.parse(record.result);
                              return (
                                <>
                                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="font-semibold text-zinc-900">Match Score / 匹配度</span>
                                      <span className="text-2xl font-bold text-black">{result.score}%</span>
                                    </div>
                                    <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200">
                                      <div className="h-full rounded-full bg-black" style={{ width: `${result.score}%` }} />
                                    </div>
                                  </div>
                                  {result.matched?.length > 0 && (
                                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-green-700"><span>✓</span> Matched / 已满足</h3>
                                      <div className="space-y-4">
                                        {result.matched.map((item: MatchItem, idx: number) => (
                                          <div key={idx} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                                            <p className="font-medium text-zinc-900">{item.item}</p>
                                            <p className="text-sm text-zinc-600">{item.en}</p>
                                            <p className="text-sm text-zinc-500">{item.cn}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {result.partial?.length > 0 && (
                                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-yellow-700"><span>⚠</span> Partial Match / 部分匹配</h3>
                                      <div className="space-y-4">
                                        {result.partial.map((item: MatchItem, idx: number) => (
                                          <div key={idx} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                                            <p className="font-medium text-zinc-900">{item.item}</p>
                                            <p className="text-sm text-zinc-600">{item.en}</p>
                                            <p className="text-sm text-zinc-500">{item.cn}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {result.missing?.length > 0 && (
                                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-red-700"><span>✗</span> Missing / 缺少技能</h3>
                                      <div className="space-y-4">
                                        {result.missing.map((item: MatchItem, idx: number) => (
                                          <div key={idx} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                                            <p className="font-medium text-zinc-900">{item.item}</p>
                                            <p className="text-sm text-zinc-600">{item.en}</p>
                                            <p className="text-sm text-zinc-500">{item.cn}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
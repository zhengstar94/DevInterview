import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "history.json");

interface HistoryItem {
  id: string;
  type: "questions" | "analysis";
  date: string;
  jd: string;
  result: string;
}

async function ensureDataFile(): Promise<HistoryItem[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    // File doesn't exist, create it
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
    return [];
  }
}

async function saveData(data: HistoryItem[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const data = await ensureDataFile();
    // Sort by date descending
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json({ records: data });
  } catch (error) {
    console.error("History GET error:", error);
    return NextResponse.json({ error: "Failed to read history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, jd, result } = await request.json();

    if (!type || !jd || !result) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (type !== "questions" && type !== "analysis") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const data = await ensureDataFile();

    const newRecord: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      date: new Date().toISOString(),
      jd: jd.substring(0, 200),
      result,
    };

    data.push(newRecord);
    await saveData(data);

    return NextResponse.json({ record: newRecord });
  } catch (error) {
    console.error("History POST error:", error);
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const data = await ensureDataFile();
    const filtered = data.filter((item) => item.id !== id);

    if (filtered.length === data.length) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await saveData(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("History DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
  }
}
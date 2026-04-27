import { NextResponse } from "next/server";
import { readdirSync } from "fs";
import { join } from "path";

export async function GET() {
  const dir = join(process.cwd(), "public", "midi");
  try {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".mid") || f.endsWith(".midi"))
      .sort();
    return NextResponse.json(files);
  } catch {
    return NextResponse.json([]);
  }
}

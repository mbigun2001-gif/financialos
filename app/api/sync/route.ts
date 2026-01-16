// API endpoint для синхронізації даних між пристроями
import { NextRequest, NextResponse } from "next/server";

// Простий in-memory storage (для production використайте базу даних)
const syncStorage = new Map<string, { data: any; timestamp: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, data, deviceId } = body;

    if (!userId || !data) {
      return NextResponse.json(
        { error: "Missing userId or data" },
        { status: 400 }
      );
    }

    // Зберігаємо дані з timestamp
    const key = `sync_${userId}`;
    syncStorage.set(key, {
      data: { ...data, deviceId, syncedAt: Date.now() },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const key = `sync_${userId}`;
    const stored = syncStorage.get(key);

    if (!stored) {
      return NextResponse.json({ data: null });
    }

    // Видаляємо застарілі дані (більше 1 години)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - stored.timestamp > oneHour) {
      syncStorage.delete(key);
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: stored.data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  try {
    const { id, title, content, hashtags, scheduledAt, status, mediaUrl } = await request.json();
    if (!id) return NextResponse.json({ error: "ID richiesto" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (status !== undefined) updateData.status = status;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;

    const post = await db.socialPost.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Errore aggiornamento" }, { status: 500 });
  }
}

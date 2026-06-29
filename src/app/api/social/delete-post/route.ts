import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID richiesto" }, { status: 400 });

    await db.socialPost.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Post eliminato" });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Errore eliminazione" }, { status: 500 });
  }
}

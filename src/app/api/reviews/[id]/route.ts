import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { replied, replyText } = body;

    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const updated = await db.review.update({
      where: { id },
      data: {
        ...(replied !== undefined && { replied }),
        ...(replyText !== undefined && { replyText }),
        ...(replyText !== undefined && { replyDate: new Date().toISOString().split("T")[0] }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
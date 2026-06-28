import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["bozza", "programmato", "pubblicato", "fallito"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const post = await db.socialPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Social post not found" }, { status: 404 });
    }

    const updated = await db.socialPost.update({
      where: { id },
      data: {
        ...(status && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating social post:", error);
    return NextResponse.json({ error: "Failed to update social post" }, { status: 500 });
  }
}
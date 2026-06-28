import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const posts = await db.socialPost.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching social posts:", error);
    return NextResponse.json({ error: "Failed to fetch social posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, type, caption, scheduledAt, status, aiSuggestion, hashtags } = body;

    if (!platform || !type) {
      return NextResponse.json({ error: "platform and type are required" }, { status: 400 });
    }

    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const post = await db.socialPost.create({
      data: {
        restaurantId: restaurant.id,
        platform,
        type,
        caption: caption || "",
        scheduledAt: scheduledAt || "",
        status: status || "bozza",
        aiSuggestion: aiSuggestion !== undefined ? aiSuggestion : true,
        hashtags: hashtags || "",
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating social post:", error);
    return NextResponse.json({ error: "Failed to create social post" }, { status: 500 });
  }
}
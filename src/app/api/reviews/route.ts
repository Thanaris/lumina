import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const reviews = await db.review.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      take: 50,
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

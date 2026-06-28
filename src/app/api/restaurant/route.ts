import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }
    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return NextResponse.json({ error: "Failed to fetch restaurant" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const updated = await db.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: body.name ?? restaurant.name,
        address: body.address ?? restaurant.address,
        phone: body.phone ?? restaurant.phone,
        email: body.email ?? restaurant.email,
        instagram: body.instagram ?? restaurant.instagram,
        tiktok: body.tiktok ?? restaurant.tiktok,
        description: body.description ?? restaurant.description,
        logoUrl: body.logoUrl ?? restaurant.logoUrl,
        coverUrl: body.coverUrl ?? restaurant.coverUrl,
        tables: body.tables ?? restaurant.tables,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return NextResponse.json({ error: "Failed to update restaurant" }, { status: 500 });
  }
}
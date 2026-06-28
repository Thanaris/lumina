import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const reservations = await db.reservation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, date, time, guests, notes, status } = body;

    if (!customerName || !date || !time || !guests) {
      return NextResponse.json(
        { error: "customerName, date, time, and guests are required" },
        { status: 400 }
      );
    }

    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const reservation = await db.reservation.create({
      data: {
        restaurantId: restaurant.id,
        customerName,
        customerPhone: customerPhone || "",
        date,
        time,
        guests: parseInt(guests, 10),
        notes: notes || "",
        status: status || "confermata",
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
  }
}
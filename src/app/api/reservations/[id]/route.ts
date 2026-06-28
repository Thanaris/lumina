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

    const validStatuses = ["confermata", "in_attesa", "completata", "annullata"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const reservation = await db.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const updated = await db.reservation.update({
      where: { id },
      data: {
        ...(status && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating reservation:", error);
    return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 });
  }
}
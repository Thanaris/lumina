import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    const validStatuses = ["nuovo", "in_cucina", "pronto", "consegnato", "annullato"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Stato non valido" },
        { status: 400 }
      );
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      order,
      message:
        status === "in_cucina"
          ? "Comanda inviata in cucina!"
          : `Stato aggiornato: ${status}`,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Errore aggiornamento ordine" },
      { status: 500 }
    );
  }
}

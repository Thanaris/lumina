import { NextRequest, NextResponse } from "next/server";
import { parseCustomerMessage } from "@/lib/ai-order-parser";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { message, phone, customerName, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Parse the message with AI
    const result = await parseCustomerMessage(message, conversationHistory || []);

    // If it's an order, create it in the database
    let createdOrderId = null;
    if (result.isOrder && result.items.length > 0) {
      const order = await db.order.create({
        data: {
          restaurantId: (await db.restaurant.findFirst())?.id || "",
          customerName: customerName || "Cliente WhatsApp",
          customerPhone: phone || "",
          status: "nuovo",
          total: result.total,
          notes: result.notes,
          source: "whatsapp",
          items: {
            create: result.items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
      createdOrderId = order.id;
    }

    return NextResponse.json({
      reply: result.aiReply,
      isOrder: result.isOrder,
      orderId: createdOrderId,
      items: result.items,
      total: result.total,
    });
  } catch (error) {
    console.error("Error processing WhatsApp chat:", error);
    return NextResponse.json(
      { error: "Failed to process message", reply: "Mi scusi, c'è stato un problema. Riprova tra poco!" },
      { status: 500 }
    );
  }
}
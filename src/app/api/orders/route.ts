import { NextRequest, NextResponse } from "next/server";
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
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, items, notes, source } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    // Find restaurant
    const restaurant = await db.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Calculate total
    let total = 0;
    const orderItemsData = [];
    for (const item of items) {
      const menuItem = await db.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) {
        return NextResponse.json({ error: `Menu item ${item.menuItemId} not found` }, { status: 400 });
      }
      const lineTotal = menuItem.price * (item.quantity || 1);
      total += lineTotal;
      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity || 1,
        notes: item.notes || "",
        price: menuItem.price,
      });
    }

    const order = await db.order.create({
      data: {
        restaurantId: restaurant.id,
        customerName: customerName || "Cliente WhatsApp",
        customerPhone: customerPhone || "",
        total,
        notes: notes || "",
        source: source || "whatsapp",
        status: "nuovo",
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const menuItem = await db.menuItem.findUnique({ where: { id } });
    if (!menuItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    const updated = await db.menuItem.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.available !== undefined && { available: body.available }),
        ...(body.allergens !== undefined && { allergens: body.allergens }),
        ...(body.imageEmoji !== undefined && { imageEmoji: body.imageEmoji }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const menuItem = await db.menuItem.findUnique({ where: { id } });
    if (!menuItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    await db.menuItem.delete({ where: { id } });
    return NextResponse.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
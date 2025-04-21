import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { itemId, userId, claimedQuantity } = await req.json();

    // Insert or update the claimed item in the database
    const { data, error } = await supabase
      .from("claimed_supply_items")
      .upsert([
        {
          item_id: itemId,
          user_id: userId,
          claimed_quantity: claimedQuantity,
          claimed_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error saving claimed item:", error);
      return NextResponse.json(
        { error: "Failed to save claimed item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in claim item API:", errorMessage);
    return NextResponse.json(
      { error: "Failed to process claim item request", details: errorMessage },
      { status: 500 }
    );
  }
}
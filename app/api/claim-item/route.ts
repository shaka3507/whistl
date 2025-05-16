import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { itemId, userId, claimedQuantity, alertId } = await req.json();

    // Validate required parameters
    if (!itemId || !userId || !alertId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if this item is already claimed
    const { data: existingClaim, error: checkError } = await supabase
      .from("claimed_supply_items")
      .select("*")
      .eq("item_id", itemId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error checking existing claim:", checkError);
      return NextResponse.json(
        { error: "Failed to check if item is already claimed" },
        { status: 500 }
      );
    }
    
    if (existingClaim) {
      // Item already claimed
      console.log("Item already claimed:", {
        itemId,
        claimedBy: existingClaim.user_id,
        requestedBy: userId,
        isSameUser: existingClaim.user_id === userId
      });
      
      return NextResponse.json(
        { error: "Item is already claimed", code: "ALREADY_CLAIMED", existingClaim },
        { status: 409 } // Conflict
      );
    }

    // Check if the item is available (get from alert_preparation_items)
    const { data: itemData, error: itemError } = await supabase
      .from("alert_preparation_items")
      .select("*, claimed_supply_items(*)")
      .eq("id", itemId)
      .eq("alert_id", alertId)
      .single();
    
    if (itemError) {
      console.error("Error fetching item details:", itemError);
      return NextResponse.json(
        { error: "Failed to fetch item details" },
        { status: 500 }
      );
    }
    
    if (!itemData) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }
    
    // Calculate how many of this item are already claimed
    const alreadyClaimed = itemData.claimed_supply_items?.reduce(
      (total: number, claim: any) => total + (claim.claimed_quantity || 0), 
      0
    ) || 0;
    
    // Check if there's enough quantity available
    if (alreadyClaimed + (claimedQuantity || 1) > itemData.quantity) {
      console.log("Insufficient quantity:", {
        itemId,
        requested: claimedQuantity || 1,
        alreadyClaimed,
        available: itemData.quantity - alreadyClaimed
      });
      
      return NextResponse.json(
        { error: "Not enough quantity available", code: "INSUFFICIENT_QUANTITY" },
        { status: 409 }
      );
    }

    // Insert the claimed item in the database
    const { data, error } = await supabase
      .from("claimed_supply_items")
      .insert([
        {
          item_id: itemId,
          user_id: userId,
          claimed_quantity: claimedQuantity || 1, // Default to 1 if not specified
          claimed_at: new Date().toISOString(),
          alert_id: alertId,
        },
      ])
      .select();

    if (error) {
      // If unique constraint violation (item claimed by someone else in the meantime)
      if (error.code === '23505') {
        console.log("Race condition occurred:", {
          itemId, 
          userId,
          error: error.message,
          details: error.details
        });
        
        return NextResponse.json(
          { error: "Item was just claimed by someone else", code: "RACE_CONDITION" },
          { status: 409 }
        );
      }
      
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
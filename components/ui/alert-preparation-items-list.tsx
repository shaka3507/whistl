"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface PrepItem {
  id: string;
  alert_id: string;
  template_item_id: number;
  name: string;
  quantity: number;
  unit: string;
  is_acquired?: boolean;
  assigned_to?: string;
  created_at: string;
}

interface AlertPreparationItemsListProps {
  alertId: string;
  showClaimButton?: boolean;
  onClaimItem?: (itemId: string) => void;
}

export function AlertPreparationItemsList({ 
  alertId, 
  showClaimButton = false,
  onClaimItem 
}: AlertPreparationItemsListProps) {
  const [items, setItems] = useState<PrepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      if (!alertId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("alert_preparation_items")
          .select("*")
          .eq("alert_id", alertId)
          .order("name");
          
        if (error) throw error;
        setItems(data || []);
      } catch (err: any) {
        console.error("Error fetching preparation items:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchItems();
  }, [alertId]);

  const handleClaimItem = async (itemId: string) => {
    if (!onClaimItem) return;
    
    try {
      onClaimItem(itemId);
    } catch (err: any) {
      console.error("Error claiming item:", err);
    }
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recommended Preparation Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recommended Preparation Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg flex items-start gap-3 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Failed to load preparation items</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Recommended Preparation Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`p-4 border rounded-lg ${item.is_acquired ? 'bg-muted/50 border-primary/30' : ''}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    {item.name}
                    {item.is_acquired && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Claimed
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.quantity} {item.unit}
                  </p>
                </div>
                
                {showClaimButton && !item.is_acquired && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleClaimItem(item.id)}
                  >
                    I'll bring this
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

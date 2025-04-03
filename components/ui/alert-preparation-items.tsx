// components/ui/alert-preparation-items.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Category = {
  id: number;
  name: string;
  description: string;
  icon?: string;
};

type Item = {
  id: number;
  name: string;
  description: string;
  recommended_quantity: number;
  unit: string;
  category_id: number;
};

type SelectedItem = {
  template_id: number;
  name: string;
  quantity: number;
  unit: string;
  selected: boolean;
};

interface AlertPreparationItemsProps {
  onItemsSelected: (items: any[]) => void;
}

export function AlertPreparationItems({ onItemsSelected }: AlertPreparationItemsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: SelectedItem }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("prepare_categories")
          .select("id, name, description, icon")
          .order("name");
          
        if (error) throw error;
        setCategories(data || []);
      } catch (err: any) {
        console.error("Error fetching categories:", err);
        setError("Failed to load emergency categories");
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategories();
  }, []);

  // Fetch items for selected category
  useEffect(() => {
    async function fetchItems() {
      if (!selectedCategory) {
        setItems([]);
        return;
      }
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("prepare_template_items")
          .select("*")
          .eq("category_id", selectedCategory)
          .order("name");
          
        if (error) throw error;
        
        setItems(data || []);
        
        // Initialize selected items with default values
        const initialSelectedItems: { [key: number]: SelectedItem } = {};
        data?.forEach(item => {
          initialSelectedItems[item.id] = {
            template_id: item.id,
            name: item.name,
            quantity: item.recommended_quantity,
            unit: item.unit,
            selected: false
          };
        });
        
        setSelectedItems(initialSelectedItems);
      } catch (err: any) {
        console.error("Error fetching items:", err);
        setError("Failed to load preparation items");
      } finally {
        setLoading(false);
      }
    }
    
    fetchItems();
  }, [selectedCategory]);

  // Update parent component when selections change
  useEffect(() => {
    const itemsList = Object.values(selectedItems).filter(item => item.selected);
    onItemsSelected(itemsList);
  }, [selectedItems, onItemsSelected]);

  // Toggle item selection
  const toggleItem = (itemId: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId].selected
      }
    }));
  };

  // Update item quantity
  const updateQuantity = (itemId: number, change: number) => {
    setSelectedItems(prev => {
      const item = prev[itemId];
      const newQuantity = Math.max(1, item.quantity + change);
      
      return {
        ...prev,
        [itemId]: {
          ...item,
          quantity: newQuantity
        }
      };
    });
  };

  if (loading && categories.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium mb-4">Select Emergency Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="justify-start h-auto py-3 px-4"
              type="button"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <div>
          <h3 className="text-base font-medium mb-4">Recommended Preparation Items</h3>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">No items found for this category.</p>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <Card key={item.id} className={selectedItems[item.id]?.selected ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          id={`item-${item.id}`} 
                          checked={selectedItems[item.id]?.selected || false}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <div>
                          <Label htmlFor={`item-${item.id}`} className="font-medium">
                            {item.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-xs mt-1">Recommended: {item.recommended_quantity} {item.unit}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={!selectedItems[item.id]?.selected}
                          onClick={() => updateQuantity(item.id, -1)}
                          type="button"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">
                          {selectedItems[item.id]?.quantity || 0}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={!selectedItems[item.id]?.selected}
                          onClick={() => updateQuantity(item.id, 1)}
                          type="button"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
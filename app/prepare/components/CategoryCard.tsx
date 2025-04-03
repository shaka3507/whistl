import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryCardProps {
  id: number;
  name: string;
  description: string;
  onViewItems: (id: number) => void;
}

export function CategoryCard({ id, name, description, onViewItems }: CategoryCardProps) {
  return (
    <Card key={id}>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          View and create preparation lists for {name} emergencies
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => onViewItems(id)}>
          View Items
        </Button>
      </CardFooter>
    </Card>
  );
} 
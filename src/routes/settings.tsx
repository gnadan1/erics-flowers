import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  inventoryCategoriesQuery,
  inventorySubcategoriesQuery,
  suppliersQuery,
  locationsQuery,
} from "@/lib/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Petal Inventory" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(inventoryCategoriesQuery);
    context.queryClient.ensureQueryData(inventorySubcategoriesQuery);
    context.queryClient.ensureQueryData(suppliersQuery);
    context.queryClient.ensureQueryData(locationsQuery);
  },
  component: SettingsPage,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">Couldn't load settings.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline" className="mt-3">
          Try again
        </Button>
      </div>
    </AppShell>
  ),
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage inventory categories, locations, and suppliers.
        </p>
      </div>
      <div className="space-y-4">
        <InventoryTaxonomyCard />
        <div className="grid gap-4 lg:grid-cols-2">
          <LocationsCard />
          <SuppliersCard />
        </div>
      </div>
    </AppShell>
  );
}

function InventoryTaxonomyCard() {
  const qc = useQueryClient();
  const { data: categories } = useSuspenseQuery(inventoryCategoriesQuery);
  const { data: subcategories } = useSuspenseQuery(inventorySubcategoriesQuery);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [days, setDays] = useState("7");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const addCategory = useMutation({
    mutationFn: async () => {
      if (!categoryName.trim()) throw new Error("Category name required");
      const { error } = await supabase
        .from("inventory_categories")
        .insert({ name: categoryName.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_categories"] });
      setCategoryName("");
      toast.success("Category added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSubcategory = useMutation({
    mutationFn: async () => {
      const d = parseInt(days, 10);
      if (!selectedCategoryId) throw new Error("Category required");
      if (!subcategoryName.trim()) throw new Error("Subcategory name required");
      if (!Number.isFinite(d) || d <= 0) throw new Error("Days must be positive");
      const { error } = await supabase.from("inventory_subcategories").insert({
        category_id: selectedCategoryId,
        name: subcategoryName.trim(),
        default_vase_life_days: d,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_subcategories"] });
      setSubcategoryName("");
      setDays("7");
      toast.success("Subcategory added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSubcategory = useMutation({
    mutationFn: async ({
      id,
      default_vase_life_days,
    }: {
      id: string;
      default_vase_life_days: number;
    }) => {
      const { error } = await supabase
        .from("inventory_subcategories")
        .update({ default_vase_life_days })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory_subcategories"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSubcategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_subcategories"] });
      toast.success("Removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grouped = categories.map((category) => ({
    category,
    items: subcategories.filter((subcategory) => subcategory.category_id === category.id),
  }));

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base">Categories &amp; subcategories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map((g) => (
            <div key={g.category.id} className="rounded-md border border-border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {g.category.name}
              </p>
              <ul className="divide-y divide-border">
                {g.items.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 py-1.5">
                    <span className="flex-1 truncate text-sm">{t.name}</span>
                    <Input
                      type="number"
                      min={1}
                      defaultValue={t.default_vase_life_days}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (Number.isFinite(v) && v > 0 && v !== t.default_vase_life_days) {
                          updateSubcategory.mutate({ id: t.id, default_vase_life_days: v });
                        }
                      }}
                      className="w-16 h-8"
                    />
                    <span className="text-xs text-muted-foreground">d</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSubcategory.mutate(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3">
          <Label className="text-xs">Add category</Label>
          <div className="mt-1 flex gap-2">
            <Input
              placeholder="Category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <Button onClick={() => addCategory.mutate()} disabled={addCategory.isPending}>
              Add
            </Button>
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <Label className="text-xs">Add subcategory</Label>
          <div className="mt-1 grid gap-2 sm:grid-cols-[1fr_1fr_5rem_auto]">
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Subcategory name"
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
            />
            <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
            <Button onClick={() => addSubcategory.mutate()} disabled={addSubcategory.isPending}>
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LocationsCard() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(locationsQuery);
  const [name, setName] = useState("");
  const add = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("locations").insert({ name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      setName("");
      toast.success("Location added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Store locations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="divide-y divide-border">
          {data.map((l) => (
            <li key={l.id} className="flex items-center gap-2 py-2">
              <span className="flex-1 truncate text-sm">{l.name}</span>
              <Button size="icon" variant="ghost" onClick={() => del.mutate(l.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="border-t border-border pt-3">
          <Label className="text-xs">Add new</Label>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="e.g. Cooler C"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={() => add.mutate()} disabled={add.isPending}>
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SuppliersCard() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(suppliersQuery);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const add = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("suppliers").insert({
        name: name.trim(),
        contact: contact.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setName("");
      setContact("");
      toast.success("Supplier added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Suppliers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="divide-y divide-border">
          {data.map((s) => (
            <li key={s.id} className="flex items-center gap-2 py-2">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{s.name}</p>
                {s.contact && <p className="truncate text-xs text-muted-foreground">{s.contact}</p>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => del.mutate(s.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="border-t border-border pt-3 space-y-2">
          <Label className="text-xs">Add new</Label>
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Contact (optional)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <Button onClick={() => add.mutate()} disabled={add.isPending} className="w-full">
            Add supplier
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { flowerTypesQuery, suppliersQuery, locationsQuery, FLOWER_CATEGORIES, type FlowerCategory } from "@/lib/queries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Petal Inventory" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(flowerTypesQuery);
    context.queryClient.ensureQueryData(suppliersQuery);
    context.queryClient.ensureQueryData(locationsQuery);
  },
  component: SettingsPage,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">Couldn't load settings.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline" className="mt-3">Try again</Button>
      </div>
    </AppShell>
  ),
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage flower types, locations, and suppliers.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <FlowerTypesCard />
        <LocationsCard />
        <SuppliersCard />
      </div>
    </AppShell>
  );
}

function FlowerTypesCard() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(flowerTypesQuery);
  const [name, setName] = useState("");
  const [days, setDays] = useState("7");

  const add = useMutation({
    mutationFn: async () => {
      const d = parseInt(days, 10);
      if (!name.trim()) throw new Error("Name required");
      if (!Number.isFinite(d) || d <= 0) throw new Error("Days must be positive");
      const { error } = await supabase
        .from("flower_types")
        .insert({ name: name.trim(), default_vase_life_days: d });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flower_types"] });
      setName("");
      setDays("7");
      toast.success("Flower type added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, default_vase_life_days }: { id: string; default_vase_life_days: number }) => {
      const { error } = await supabase.from("flower_types").update({ default_vase_life_days }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flower_types"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("flower_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flower_types"] });
      toast.success("Removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Flower types</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <ul className="divide-y divide-border">
          {data.map((t) => (
            <li key={t.id} className="flex items-center gap-2 py-2">
              <span className="flex-1 truncate text-sm font-medium">{t.name}</span>
              <Input
                type="number"
                min={1}
                defaultValue={t.default_vase_life_days}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isFinite(v) && v > 0 && v !== t.default_vase_life_days) {
                    update.mutate({ id: t.id, default_vase_life_days: v });
                  }
                }}
                className="w-20"
              />
              <span className="text-xs text-muted-foreground">days</span>
              <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="border-t border-border pt-3">
          <Label className="text-xs">Add new</Label>
          <div className="flex gap-2 mt-1">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input type="number" min={1} className="w-20" value={days} onChange={(e) => setDays(e.target.value)} />
            <Button onClick={() => add.mutate()} disabled={add.isPending}>Add</Button>
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
      <CardHeader><CardTitle className="text-base">Store locations</CardTitle></CardHeader>
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
            <Input placeholder="e.g. Cooler C" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={() => add.mutate()} disabled={add.isPending}>Add</Button>
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
      <CardHeader><CardTitle className="text-base">Suppliers</CardTitle></CardHeader>
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
          <Input placeholder="Contact (optional)" value={contact} onChange={(e) => setContact(e.target.value)} />
          <Button onClick={() => add.mutate()} disabled={add.isPending} className="w-full">Add supplier</Button>
        </div>
      </CardContent>
    </Card>
  );
}

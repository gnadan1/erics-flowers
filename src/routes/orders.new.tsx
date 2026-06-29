import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { OrderHeaderForm } from "@/components/OrderHeaderForm";
import { emptyOrderFormValues, orderPayloadFromForm, type OrderFormValues } from "@/lib/orderForm";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/new")({
  head: () => ({ meta: [{ title: "New Order - Petal Inventory" }] }),
  component: NewOrderPage,
});

function NewOrderPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [values, setValues] = useState<OrderFormValues>(() => emptyOrderFormValues());

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = orderPayloadFromForm(values);
      const { data, error } = await supabase.from("orders").insert(payload).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (orderId) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order created");
      navigate({ to: "/orders/$orderId", params: { orderId } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New order</h1>
          <p className="text-sm text-muted-foreground">Create the order header first.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order header</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderHeaderForm
            values={values}
            onChange={setValues}
            onSubmit={() => mutation.mutate()}
            submitLabel="Create order"
            isPending={mutation.isPending}
            secondaryAction={
              <Button asChild type="button" variant="outline">
                <Link to="/orders">Cancel</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}

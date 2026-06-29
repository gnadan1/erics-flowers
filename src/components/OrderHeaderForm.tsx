import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FULFILLMENT_OPTIONS,
  ORDER_SOURCE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  type OrderFormValues,
} from "@/lib/orderForm";
import type { FulfillmentMethod, OrderSource, OrderStatus } from "@/lib/queries";
import type { ReactNode } from "react";

const SATISFACTION_NONE = "none";

export function OrderHeaderForm({
  values,
  onChange,
  onSubmit,
  submitLabel,
  isPending,
  secondaryAction,
}: {
  values: OrderFormValues;
  onChange: (values: OrderFormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  isPending: boolean;
  secondaryAction?: ReactNode;
}) {
  function patch(next: Partial<OrderFormValues>) {
    onChange({ ...values, ...next });
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label htmlFor="order_number">Order # *</Label>
          <Input
            id="order_number"
            value={values.orderNumber}
            onChange={(event) => patch({ orderNumber: event.target.value })}
            required
          />
        </div>
        <div>
          <Label>Source</Label>
          <Select
            value={values.source}
            onValueChange={(source) => patch({ source: source as OrderSource })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="referring_order_number">Referring order #</Label>
          <Input
            id="referring_order_number"
            value={values.referringOrderNumber}
            onChange={(event) => patch({ referringOrderNumber: event.target.value })}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={values.status}
            onValueChange={(status) => patch({ status: status as OrderStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label htmlFor="recipient_name">Recipient</Label>
          <Input
            id="recipient_name"
            value={values.recipientName}
            onChange={(event) => patch({ recipientName: event.target.value })}
          />
        </div>
        <div>
          <Label>Fulfillment</Label>
          <Select
            value={values.fulfillmentMethod}
            onValueChange={(fulfillmentMethod) =>
              patch({ fulfillmentMethod: fulfillmentMethod as FulfillmentMethod })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FULFILLMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={values.phone}
            onChange={(event) => patch({ phone: event.target.value })}
          />
        </div>
        <div>
          <Label>Satisfaction</Label>
          <Select
            value={values.satisfaction || SATISFACTION_NONE}
            onValueChange={(satisfaction) =>
              patch({ satisfaction: satisfaction === SATISFACTION_NONE ? "" : satisfaction })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SATISFACTION_NONE}>None</SelectItem>
              {[1, 2, 3, 4, 5].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}/5
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={values.address}
          onChange={(event) => patch({ address: event.target.value })}
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="order_notes">Notes</Label>
        <Textarea
          id="order_notes"
          value={values.notes}
          onChange={(event) => patch({ notes: event.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        {secondaryAction}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

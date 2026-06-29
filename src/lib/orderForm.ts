import type { FulfillmentMethod, Order, OrderSource, OrderStatus } from "@/lib/queries";

export type OrderFormValues = {
  orderNumber: string;
  source: OrderSource;
  referringOrderNumber: string;
  recipientName: string;
  fulfillmentMethod: FulfillmentMethod;
  address: string;
  phone: string;
  satisfaction: string;
  status: OrderStatus;
  notes: string;
};

export const ORDER_SOURCE_OPTIONS: ReadonlyArray<{ value: OrderSource; label: string }> = [
  { value: "dove", label: "DOVE" },
  { value: "fsn", label: "FSN" },
  { value: "phone", label: "Phone" },
  { value: "in_person", label: "In-person" },
  { value: "spec", label: "Spec" },
];

export const FULFILLMENT_OPTIONS: ReadonlyArray<{ value: FulfillmentMethod; label: string }> = [
  { value: "pickup", label: "Pickup" },
  { value: "shop", label: "Shop" },
  { value: "delivery", label: "Delivery" },
];

export const ORDER_STATUS_OPTIONS: ReadonlyArray<{ value: OrderStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
];

export function emptyOrderFormValues(): OrderFormValues {
  return {
    orderNumber: "",
    source: "phone",
    referringOrderNumber: "",
    recipientName: "",
    fulfillmentMethod: "pickup",
    address: "",
    phone: "",
    satisfaction: "",
    status: "draft",
    notes: "",
  };
}

export function orderToFormValues(order: Order): OrderFormValues {
  return {
    orderNumber: order.order_number,
    source: order.source,
    referringOrderNumber: order.referring_order_number ?? "",
    recipientName: order.recipient_name ?? "",
    fulfillmentMethod: order.fulfillment_method,
    address: order.address ?? "",
    phone: order.phone ?? "",
    satisfaction: order.satisfaction === null ? "" : String(order.satisfaction),
    status: order.status,
    notes: order.notes ?? "",
  };
}

function optionalText(value: string) {
  return value.trim() || null;
}

export function orderPayloadFromForm(values: OrderFormValues) {
  const satisfaction = values.satisfaction.trim() ? parseInt(values.satisfaction, 10) : null;

  if (!values.orderNumber.trim()) {
    throw new Error("Order number is required");
  }
  if (
    satisfaction !== null &&
    (!Number.isFinite(satisfaction) || satisfaction < 1 || satisfaction > 5)
  ) {
    throw new Error("Satisfaction must be 1-5");
  }

  return {
    order_number: values.orderNumber.trim(),
    source: values.source,
    referring_order_number: optionalText(values.referringOrderNumber),
    recipient_name: optionalText(values.recipientName),
    fulfillment_method: values.fulfillmentMethod,
    address: optionalText(values.address),
    phone: optionalText(values.phone),
    satisfaction,
    status: values.status,
    notes: optionalText(values.notes),
  };
}

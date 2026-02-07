/**
 * Константы и метки для заказов (единый источник для Profile и MyReadings)
 */
export const ORDER_STATUS_LABELS = {
  pending: "Ожидает оплаты",
  paid: "В работе",
  delivered: "Исполнен",
};

export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status;
}

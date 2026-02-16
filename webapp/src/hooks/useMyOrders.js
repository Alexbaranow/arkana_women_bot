import { useEffect, useState } from "react";
import { getInitData } from "../utils/telegram";
import { getApiUrl } from "../config/api";

/** Загрузка списка заказов пользователя (DRY: общий хук для Profile и MyReadings) */
export function useMyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${getApiUrl()}/api/my-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: getInitData() }),
    })
      .then((r) => r.json())
      .then((data) => setOrders(data.ok && data.orders ? data.orders : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return { orders, loading, setOrders };
}

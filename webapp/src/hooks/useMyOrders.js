import { useEffect, useState } from "react";
import { getInitData } from "../utils/telegram";

const API_URL = import.meta.env.VITE_API_URL || "";

/** Загрузка списка заказов пользователя (DRY: общий хук для Profile и MyReadings) */
export function useMyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/my-orders`, {
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

"use client";

import { useState, useEffect, useCallback } from "react";

export interface VehicleData {
  id: string;
  carNumber: string;
  inspectionType: string;
  nextDueDate: { seconds: number; nanoseconds: number } | Date;
  linkToken: string;
  customerName?: string;
  customerPhone?: string;
}

export function useVehicleByToken(token: string | null) {
  const [data, setData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/by-token?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "차량 정보를 불러올 수 없습니다.");
      setData(data);
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message || "차량 정보를 불러올 수 없습니다.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  return { data, loading, error, refetch: fetchVehicle };
}

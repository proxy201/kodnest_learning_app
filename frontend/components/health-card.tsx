"use client";

import { useEffect, useState } from "react";

import { apiFetch, getApiBaseUrl } from "@/lib/api";

type HealthResponse = {
  status: string;
  timestamp: string;
  environment: string;
  appOrigin: string;
  database: {
    status: string;
    message: string;
  };
};

export const HealthCard = () => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = getApiBaseUrl() || "/api";

  const loadHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch<HealthResponse>("/api/health");
      setData(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reach the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  return (
    <section className="surface-panel rounded-[2rem] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow text-ink/45">
            Health
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            Backend status
          </h2>
        </div>
        <button
          className="action-primary rounded-full px-4 py-2 text-sm font-medium transition"
          onClick={() => void loadHealth()}
          type="button"
        >
          Refresh status
        </button>
      </div>

      <div className="surface-dark mt-6 rounded-[1.5rem] px-5 py-4 text-sm text-mist">
        <p>API base URL: {apiBaseUrl}</p>
        <p className="mt-1">Credentials mode: include</p>
      </div>

      <div className="mt-6 space-y-3 text-sm text-ink/75">
        {loading && <p>Checking backend health...</p>}
        {error && (
          <p className="alert-shell alert-error rounded-2xl border p-4">
            {error}
          </p>
        )}
        {data && !loading && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-soft rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                App status
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">{data.status}</p>
              <p className="mt-1 text-ink/65">{data.environment}</p>
            </div>
            <div className="surface-soft rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                Database status
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {data.database.status}
              </p>
              <p className="mt-1 text-ink/65">{data.database.message}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

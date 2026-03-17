"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { Spinner } from "@/components/common/spinner";
import { useAuth } from "@/components/auth/auth-provider";

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { ready, status } = useAuth();

  useEffect(() => {
    if (ready && status === "anonymous") {
      router.replace("/auth/login");
    }
  }, [ready, router, status]);

  if (!ready || status === "loading") {
    return (
      <div className="surface-panel rounded-[2rem] p-8">
        <Spinner label="Checking your session..." />
      </div>
    );
  }

  if (status === "anonymous") {
    return null;
  }

  return <>{children}</>;
};

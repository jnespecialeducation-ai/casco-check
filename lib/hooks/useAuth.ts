"use client";

import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  type User,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import { auth, isFirebaseReady } from "@/lib/firebase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !isFirebaseReady) {
      setLoading(false);
      return;
    }
    let done = false;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (done) return;
      done = true;
      setUser(u);
      setLoading(false);
    });
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      setLoading(false);
      unsub();
    }, 5000);
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const login = async (passwordOrToken: string) => {
    if (!auth || !isFirebaseReady) {
      throw new Error("Firebase가 설정되지 않았습니다. .env.local을 확인해 주세요.");
    }
    const res = await fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        passwordOrToken.length > 20
          ? { token: passwordOrToken }
          : { password: passwordOrToken }
      ),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "로그인에 실패했습니다.");
    }
    const { token } = await res.json();
    await signInWithCustomToken(auth, token);
  };

  const logout = async () => {
    if (auth && isFirebaseReady) {
      await signOut(auth);
    }
    await fetch("/api/auth/admin/logout", { method: "POST" });
  };

  return { user, loading, login, logout };
}

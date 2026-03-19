import { useState } from "react";
import { apiUrl } from "../api.js";

export function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ password: form.get("password") as string }),
        credentials: "include",
      });

      if (res.ok) {
        onSuccess();
      } else if (res.status === 429) {
        setError("Too many attempts — try again in a minute");
      } else {
        setError("Wrong passphrase");
      }
    } catch {
      setError("Connection error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-screen w-screen bg-neutral-950 flex flex-col items-center justify-center">
      <div className="bg-neutral-900 rounded-xl p-8 w-96 shadow-2xl border border-neutral-800">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1 text-center">Takeoff Protocol</h1>
        <p className="text-neutral-500 text-sm mb-6 text-center">Enter passphrase to continue</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            name="password"
            placeholder="Passphrase"
            autoFocus
            required
            className="w-full bg-neutral-800 text-white rounded-lg px-4 py-3 mb-4 outline-none border border-neutral-700 focus:border-neutral-500 transition-colors placeholder:text-neutral-600"
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg py-3 font-medium transition-colors"
          >
            {submitting ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

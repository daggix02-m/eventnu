"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@eventnu/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { redeemVerificationCode } from "@/lib/auth";

const EMAIL_KEY = "eventnu_auth_email";
const REDIRECT_KEY = "eventnu_auth_redirect";
const PENDING_TERMS_KEY = "eventnu_pending_terms";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthActions();
  const ensureProfile = useMutation(api.profiles.ensureProfile);
  const acceptTerms = useMutation(api.profiles.acceptTerms);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  const complete = useCallback(
    async (mail: string, verificationCode: string) => {
      setStatus("loading");
      setError("");
      try {
        await redeemVerificationCode(signIn, mail, verificationCode);
        try {
          await ensureProfile({});
        } catch {
          /* retried on next visit */
        }
        const pendingTerms = sessionStorage.getItem(PENDING_TERMS_KEY);
        if (pendingTerms) {
          try {
            await acceptTerms({ version: pendingTerms });
            sessionStorage.removeItem(PENDING_TERMS_KEY);
          } catch {
            /* non-fatal */
          }
        }
        let target = "/";
        try {
          target = sessionStorage.getItem(REDIRECT_KEY) || "/";
          sessionStorage.removeItem(REDIRECT_KEY);
        } catch {
          /* ignore */
        }
        router.replace(target);
        router.refresh();
      } catch (err) {
        setStatus("error");
        setError(
          err instanceof Error
            ? err.message.includes("expired") || err.message.includes("Invalid") || err.message.includes("verifier")
              ? "This link is invalid or has expired. Please request a new one."
              : err.message
            : "Could not sign in. Please try again."
        );
      }
    },
    [router, signIn, ensureProfile, acceptTerms]
  );

  useEffect(() => {
    const urlCode = searchParams.get("code");
    const mail = sessionStorage.getItem(EMAIL_KEY) || "";

    if (urlCode) {
      if (mail) {
        complete(mail, urlCode);
      } else {
        setEmail("");
        setCode(urlCode);
        setStatus("idle");
      }
    } else {
      setStatus("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !code.trim()) {
      setError("Please enter both your email and the code from the email.");
      return;
    }
    complete(email.trim().toLowerCase(), code.trim());
  };

  return (
    <Container className="py-xl flex justify-center">
      <div className="w-full max-w-[28rem] space-y-md">
        <h1 className="font-display text-headline-md text-on-surface">Finishing sign in…</h1>

        {status === "loading" && (
          <div className="flex items-center gap-md rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-body-md text-on-surface-variant">Verifying your link and signing you in.</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-md rounded-xl border border-error/40 bg-error/10 p-lg">
            <p role="alert" className="text-body-md text-error">
              {error}
            </p>
            <p className="text-body-md text-on-surface-variant">
              Request a new sign-in link from the sign-in form and try again.
            </p>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to home
            </Button>
          </div>
        )}

        {status === "idle" && (
          <form onSubmit={handleManualSubmit} className="space-y-md rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <p className="text-body-md text-on-surface-variant">
              Your email wasn&apos;t saved in this browser. Enter the email you used and the code from the email to sign in.
            </p>
            <div className="space-y-sm">
              <Label htmlFor="cb-email">Email</Label>
              <Input
                id="cb-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-sm">
              <Label htmlFor="cb-code">Code</Label>
              <Input
                id="cb-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. 8AB2K9DX"
                className="font-mono tracking-[0.2em]"
                required
              />
            </div>
            {error && <p className="text-body-md text-error">{error}</p>}
            <Button type="submit" className="w-full">
              Verify and sign in
            </Button>
          </form>
        )}
      </div>
    </Container>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-xl flex justify-center">
          <div className="flex items-center gap-md">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-body-md text-on-surface-variant">Loading…</p>
          </div>
        </Container>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}

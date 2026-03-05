import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NjordaLogo } from "@/components/layout/NjordaLogo";
import { useAuth } from "@/lib/auth";
import { getDefaultPath } from "@/lib/navigation";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, validateCredentials, completeLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [gdprConsent, setGdprConsent] = useState(false);

  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [twoFAError, setTwoFAError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    document.title = "Logga in — Säkra";
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(getDefaultPath(), { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await validateCredentials(username, password);
      setShow2FA(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggningen misslyckades");
    } finally {
      setLoading(false);
    }
  }

  function autoSubmit() {
    if (verifying) return;
    setVerifying(true);
    setTimeout(() => {
      completeLogin();
      setVerifying(false);
    }, 600);
  }

  function handleCodeChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    setTwoFAError("");

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (next.every((d) => d !== "")) {
      autoSubmit();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...code];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setCode(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit when all 6 digits are pasted
    if (next.every((d) => d !== "")) {
      autoSubmit();
    }
  }

  function handleVerify() {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setTwoFAError("Ange en 6-siffrig kod");
      return;
    }
    setVerifying(true);
    // Fake verification delay, then complete the real login
    setTimeout(() => {
      completeLogin();
      setVerifying(false);
    }, 600);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm rounded-[16px]">
        <CardHeader className="items-center space-y-4 pb-2">
          <NjordaLogo />
          <p className="text-sm text-muted-foreground">
            Logga in på ditt konto
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Användarnamn</Label>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="gdpr-consent"
                checked={gdprConsent}
                onCheckedChange={(v) => setGdprConsent(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="gdpr-consent" className="text-xs leading-snug text-muted-foreground cursor-pointer">
                Jag bekräftar att jag ansvarar för att rätt kunddata lagras i systemet i enlighet med gällande regelverk.
              </label>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !gdprConsent}>
              {loading ? "Loggar in..." : "Logga in"}
            </Button>
          </form>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground/70">
            Vi värnar om din integritet.{" "}
            <a href="#" className="underline underline-offset-2 hover:text-foreground">
              Läs om hur vi hanterar data &rarr;
            </a>
          </p>
        </CardContent>
      </Card>

      <Dialog open={show2FA} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="size-6 text-primary" />
            </div>
            <DialogTitle>Tvåfaktorsautentisering</DialogTitle>
            <DialogDescription>
              Ange den 6-siffriga koden från din autentiseringsapp
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 pt-2">
            <div className="flex gap-2" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className="size-11 rounded-md border border-input bg-background text-center text-lg font-brand tracking-wide shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ))}
            </div>

            {twoFAError && (
              <p className="text-sm text-destructive">{twoFAError}</p>
            )}

            <Button
              onClick={handleVerify}
              className="w-full"
              disabled={verifying || code.join("").length !== 6}
            >
              {verifying ? "Verifierar..." : "Verifiera"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

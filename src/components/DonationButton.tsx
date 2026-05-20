import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PRESETS = [5, 10, 25, 50];

interface DonationButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
}

export function DonationButton({
  variant = "default",
  size = "default",
  className,
  label = "Donate",
}: DonationButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"one_off" | "monthly">("one_off");
  const [amount, setAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  async function handleDonate() {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!finalAmount || finalAmount < 1) {
      toast({ title: "Enter an amount", description: "Minimum £1.00", variant: "destructive" });
      return;
    }
    if (!email) {
      toast({ title: "Enter your email", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-donation-checkout", {
        body: {
          type,
          amountPence: Math.round(finalAmount * 100),
          donorName: name.trim(),
          donorEmail: email.trim(),
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start donation";
      toast({ title: "Donation error", description: msg, variant: "destructive" });
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Heart className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" /> Support The Lions
          </DialogTitle>
          <DialogDescription>
            Every donation helps fund kit, equipment, and pitch hire for our players. Payments are processed securely via GoCardless Direct Debit.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as "one_off" | "monthly")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="one_off">One-Off</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="one_off" className="text-xs text-muted-foreground pt-2">
            A single Direct Debit payment.
          </TabsContent>
          <TabsContent value="monthly" className="text-xs text-muted-foreground pt-2">
            Recurring monthly Direct Debit — cancel anytime via your bank.
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <Label className="text-xs font-display tracking-wider">Amount (£)</Label>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p}
                type="button"
                variant={!customAmount && amount === p ? "default" : "outline"}
                onClick={() => {
                  setAmount(p);
                  setCustomAmount("");
                }}
                className="font-display"
              >
                £{p}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            min={1}
            step="0.01"
            placeholder="Or enter custom amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="donor-name" className="text-xs font-display tracking-wider">Name (optional)</Label>
            <Input
              id="donor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label htmlFor="donor-email" className="text-xs font-display tracking-wider">Email</Label>
            <Input
              id="donor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <Button onClick={handleDonate} disabled={loading} className="w-full font-display tracking-wider">
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting...</>
          ) : (
            <>Donate £{(customAmount ? parseFloat(customAmount) || 0 : amount).toFixed(2)} {type === "monthly" ? "/ month" : ""}</>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

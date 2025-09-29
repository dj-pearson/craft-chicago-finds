import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, UserPlus, Heart, ShoppingBag, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SubtleSignupPromptProps {
  variant?: "wishlist" | "cart" | "notifications" | "general";
  className?: string;
}

export const SubtleSignupPrompt = ({
  variant = "general",
  className = "",
}: SubtleSignupPromptProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if user is logged in or prompt was dismissed
  if (user || dismissed) return null;

  const prompts = {
    wishlist: {
      icon: Heart,
      title: "Save your favorites",
      description:
        "Create an account to save items to your wishlist and never lose track of what you love.",
      cta: "Sign up to save favorites",
    },
    cart: {
      icon: ShoppingBag,
      title: "Keep your cart safe",
      description:
        "Sign up to save your cart across devices and get notified about price drops.",
      cta: "Create account",
    },
    notifications: {
      icon: Bell,
      title: "Stay in the loop",
      description:
        "Get notified when your favorite makers add new items or when items go on sale.",
      cta: "Sign up for updates",
    },
    general: {
      icon: UserPlus,
      title: "Join the community",
      description:
        "Create an account to save favorites, track orders, and connect with local makers.",
      cta: "Sign up free",
    },
  };

  const prompt = prompts[variant];
  const Icon = prompt.icon;

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">{prompt.title}</h4>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {prompt.description}
              </p>
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
                className="h-7 px-3 text-xs"
              >
                {prompt.cta}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

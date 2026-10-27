import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthGateDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function AuthGateDialog({
  title,
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: AuthGateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) onClose?.();
  };

  return (
    <Dialog open={internalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{title ?? "ورود به Nexus Bet"}</DialogTitle>
        <DialogDescription>
          برای ادامه وارد حساب Nexus Bet شوید
        </DialogDescription>
        {logo ? (
          <div className="flex justify-center py-4">
            <img src={logo} alt="" className="h-12 w-auto" />
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" onClick={onLogin}>
            ورود به Nexus Bet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

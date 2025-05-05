import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';

// Mobile link component for consistent styling
const MobileLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link> & { onOpenChange?: (open: boolean) => void }
>(({ className, onOpenChange, ...props }, ref) => {
  return (
    <Link
      ref={ref}
      onClick={() => {
        onOpenChange?.(false);
      }}
      className="block py-2 text-base transition-colors hover:text-primary"
      {...props}
    />
  );
});
MobileLink.displayName = "MobileLink";

interface MobileNavProps {
  isMenuOpen: boolean;
  isHomePage: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ isMenuOpen, isHomePage }) => {
  const [open, setOpen] = useState(isMenuOpen);
  const { user } = useAuth();
  
  return (
    <Sheet open={isMenuOpen} onOpenChange={setOpen}>
      <SheetContent side="left" className="pr-0">
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
            <MobileLink to="/" onOpenChange={setOpen}>
              Home
            </MobileLink>
            <MobileLink to="/about" onOpenChange={setOpen}>
              About
            </MobileLink>
            <MobileLink to="/pricing" onOpenChange={setOpen}>
              Pricing
            </MobileLink>
            <MobileLink to="/contact" onOpenChange={setOpen}>
              Contact
            </MobileLink>
            
            {user && (
              <>
                <div className="h-px bg-border my-2" />
                <MobileLink to="/dashboard" onOpenChange={setOpen}>
                  Dashboard
                </MobileLink>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;

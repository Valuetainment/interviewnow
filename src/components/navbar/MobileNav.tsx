import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const MobileNav: React.FC<MobileNavProps> = ({ isMenuOpen }) => {
  const location = useLocation();
  
  // Don't display dashboard navigation in dashboard routes to avoid redundancy
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/candidates') ||
                          location.pathname.startsWith('/positions') ||
                          location.pathname.startsWith('/companies') ||
                          location.pathname.startsWith('/sessions') ||
                          location.pathname.startsWith('/reports');

  return (
    <Sheet open={isMenuOpen}>
      <SheetContent side="left" className="pr-0">
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
            <MobileLink to="/">
              Home
            </MobileLink>
            
            {!isDashboardRoute && (
              <div className="flex flex-col space-y-2">
                <h4 className="font-medium">Features</h4>
                <MobileLink to="/features/interviews" className="text-muted-foreground">
                  AI Interviews
                </MobileLink>
                <MobileLink to="/features/assessments" className="text-muted-foreground">
                  Assessments
                </MobileLink>
                <MobileLink to="/features/resume-parsing" className="text-muted-foreground">
                  Resume Parsing
                </MobileLink>
                <MobileLink to="/features/analytics" className="text-muted-foreground">
                  Analytics
                </MobileLink>
              </div>
            )}
            
            {!isDashboardRoute && (
              <>
                <MobileLink to="/pricing">
                  Pricing
                </MobileLink>
                <MobileLink to="/about">
                  About
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
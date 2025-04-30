import React from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { Menu } from 'lucide-react';

interface MobileNavProps {
  isMenuOpen: boolean;
  isHomePage: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ isMenuOpen, isHomePage }) => {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);

  // Update open state when isMenuOpen prop changes
  React.useEffect(() => {
    setOpen(isMenuOpen);
  }, [isMenuOpen]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <MobileLink to="/" className="flex items-center" onOpenChange={setOpen}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary mr-2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="font-bold text-xl">InterviewAI</span>
        </MobileLink>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
            <MobileLink to="/" onOpenChange={setOpen}>
              Home
            </MobileLink>
            <div className="flex flex-col space-y-2">
              <h4 className="font-medium">Features</h4>
              <MobileLink to="/features/interviews" onOpenChange={setOpen} className="text-muted-foreground">
                AI Interviews
              </MobileLink>
              <MobileLink to="/features/assessments" onOpenChange={setOpen} className="text-muted-foreground">
                Assessments
              </MobileLink>
              <MobileLink to="/features/resume-parsing" onOpenChange={setOpen} className="text-muted-foreground">
                Resume Parsing
              </MobileLink>
              <MobileLink to="/features/analytics" onOpenChange={setOpen} className="text-muted-foreground">
                Analytics
              </MobileLink>
            </div>
            <MobileLink to="/pricing" onOpenChange={setOpen}>
              Pricing
            </MobileLink>
            <MobileLink to="/about" onOpenChange={setOpen}>
              About
            </MobileLink>
          </div>
        </ScrollArea>
        <div className="border-t pt-4 pl-6">
          {user ? (
            <MobileLink to="/dashboard" onOpenChange={setOpen} className="font-medium">
              Dashboard
            </MobileLink>
          ) : (
            <div className="flex flex-col space-y-3">
              <MobileLink to="/login" onOpenChange={setOpen}>
                Login
              </MobileLink>
              <MobileLink to="/signup" onOpenChange={setOpen} className="font-medium">
                Sign Up
              </MobileLink>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface MobileLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

function MobileLink({ to, children, className, onOpenChange }: MobileLinkProps) {
  return (
    <Link
      to={to}
      className={className}
      onClick={() => {
        onOpenChange?.(false);
      }}
    >
      {children}
    </Link>
  );
}

export default MobileNav;

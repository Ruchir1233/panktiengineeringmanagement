import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Users, CreditCard, Home, LogOut, Menu, X, UserPlus, Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigateTo = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Add Customer', path: '/add-customer', icon: UserPlus },
    { label: 'Customers', path: '/payment-tracking', icon: Users },
    { label: 'Add Employee', path: '/add-employee', icon: Briefcase },
    { label: 'Attendance', path: '/employee-attendance', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="font-bold text-2xl md:text-3xl cursor-pointer bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" 
            onClick={() => navigate('/dashboard')}
          >
            PANKTI ENGINEERING
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "h-9 gap-1 text-base hover:bg-transparent hover:text-primary transition-colors",
                location.pathname === item.path && "text-primary font-medium"
              )}
              onClick={() => navigateTo(item.path)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            className="h-9 gap-1 text-base hover:bg-transparent hover:text-destructive transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute w-full bg-background border-b border-border/40 animate-slide-down">
          <nav className="container py-4 flex flex-col gap-2">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "justify-start gap-2 text-base",
                  location.pathname === item.path && "text-primary font-medium"
                )}
                onClick={() => navigateTo(item.path)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
            <Button
              variant="ghost"
              className="justify-start gap-2 text-base text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

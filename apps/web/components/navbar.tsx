'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavBarProps {
  onMenuClick: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/uploads', label: 'Uploads' },
  { href: '/schedule', label: 'Schedule Post' },
  { href: '/history', label: 'History' },
];

export function NavBar({ onMenuClick }: NavBarProps) {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4 lg:space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex mx-6 flex-1">
          <div className="flex items-center space-x-4 lg:space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500',
                  pathname === item.href
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-orange-500/10"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t">
        <div className="flex overflow-x-auto px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-shrink-0 px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 border-b-2 border-orange-400'
                  : 'text-muted-foreground hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

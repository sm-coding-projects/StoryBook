"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Camera,
  Images,
  Settings,
  LogOut,
  Menu,
  Plus,
} from "lucide-react";

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const navItems = [
  { href: "/", label: "Collections", icon: Images },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ pathname, onClick }: { pathname: string; onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu({ user }: { user: User }) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 px-3">
          <Avatar className="size-7">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm">{user.name ?? user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <Link href="/" className="flex h-14 items-center gap-2 border-b px-4 hover:bg-accent transition-colors">
          <Camera className="size-5" strokeWidth={1.5} />
          <span className="text-lg font-light tracking-tight">StoryBook</span>
        </Link>

        <div className="flex-1 overflow-auto p-4">
          <Link href="/collections/new">
            <Button className="w-full mb-4" size="sm">
              <Plus className="size-4 mr-2" />
              New Collection
            </Button>
          </Link>
          <NavLinks pathname={pathname} />
        </div>

        <div className="border-t p-4">
          <UserMenu user={user} />
        </div>
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex md:hidden h-14 items-center gap-4 border-b px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center gap-2 border-b px-4">
                <Camera className="size-5" strokeWidth={1.5} />
                <span className="text-lg font-light tracking-tight">StoryBook</span>
              </div>
              <div className="flex-1 p-4">
                <Link href="/collections/new" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full mb-4" size="sm">
                    <Plus className="size-4 mr-2" />
                    New Collection
                  </Button>
                </Link>
                <NavLinks pathname={pathname} onClick={() => setMobileOpen(false)} />
              </div>
              <div className="border-t p-4">
                <UserMenu user={user} />
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <Camera className="size-5" strokeWidth={1.5} />
            <span className="text-lg font-light tracking-tight">StoryBook</span>
          </Link>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

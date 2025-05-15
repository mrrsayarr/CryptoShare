
"use client";
import Link from 'next/link';
import { LockKeyhole, MessageSquareText, ShieldCheck, Moon, Sun, Info, ShieldQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { setTheme } = useTheme();

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 text-xl font-semibold text-primary hover:text-primary/90 transition-colors">
            <LockKeyhole className="h-7 w-7" />
            <span>Cryptoshare</span>
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/" passHref>
              <Button variant="ghost" className="text-foreground hover:bg-accent/10 hover:text-accent-foreground px-2 sm:px-3">
                <MessageSquareText className="mr-0 sm:mr-2 h-5 w-5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </Link>
            <Link href="/password-strength" passHref>
              <Button variant="ghost" className="text-foreground hover:bg-accent/10 hover:text-accent-foreground px-2 sm:px-3">
                <ShieldQuestion className="mr-0 sm:mr-2 h-5 w-5" />
                <span className="hidden sm:inline">Password Tool</span>
              </Button>
            </Link>
            <Link href="/about" passHref>
              <Button variant="ghost" className="text-foreground hover:bg-accent/10 hover:text-accent-foreground px-2 sm:px-3">
                <Info className="mr-0 sm:mr-2 h-5 w-5" />
                <span className="hidden sm:inline">About</span>
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent/10 hover:text-accent-foreground">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

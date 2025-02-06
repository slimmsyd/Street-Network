"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Home,
  Share2,
  Clock,
  Star,
  Trash2,
  Settings,
  Plus,
  GitBranch,
  Crown,
  Users,
  Book,
} from "lucide-react";
import { DashboardSidebarProps } from "@/types/user";
import { useSession } from "next-auth/react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function DashboardSidebar({
  activePage = "",
  onNavigate,
  userName = "SS",
  userAvatar = "",
  rewardPoints = 0,
}: DashboardSidebarProps) {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleNavigation = (page: string) => {
    console.log("Navigation clicked", page);
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "familyTree", label: "Street Tree", icon: GitBranch },
    { id: "submit", label: "Crypto Submit", icon: Plus },
    { id: "list", label: "Crypto List", icon: Users },
    { id: "resources", label: "Resources", icon: Book },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "fundingPage", label: "Community Fund", icon: Book },
  ];

  const SidebarContent = () => (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex flex-col items-center justify-center p-6 border-b border-[#DDDDDD]">
        <Avatar className="h-20 w-20 border-2 border-[#F0EFFF]">
          {userAvatar ? (
            <AvatarImage src={userAvatar} alt={userName} />
          ) : (
            <AvatarFallback className="bg-[#F0EFFF] text-[#3B35C3]">
              {userName?.split(" ").map((n) => n[0]).join("") || "U"}
            </AvatarFallback>
          )}
        </Avatar>
        <h2 className="mt-4 text-lg font-semibold text-zinc-800">{userName}</h2>
        <div className="mt-2 flex items-center gap-1">
          <Crown className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-zinc-600">{rewardPoints} points</span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start ${
                activePage === item.id
                  ? "bg-[#F0EFFF] text-[#3B35C3]"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
              onClick={() => handleNavigation(item.id)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 border-r border-[#DDDDDD] pointer-events-none">
        <div className="relative h-full">
          <SidebarContent />
          {activePage === 'nftMint' && (
            <div className="absolute inset-0 backdrop-blur-sm bg-white/30 pointer-events-auto" />
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-6 w-6 text-zinc-800" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

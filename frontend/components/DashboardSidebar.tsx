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
} from "lucide-react";
import { DashboardSidebarProps } from "@/types/user";
import { useSession } from "next-auth/react";

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
  const handleNavigation = (page: string) => {
    console.log("Navigation clicked", page);
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "familyTree", label: "Street Tree", icon: GitBranch },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 border-r border-zinc-200 p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Avatar className="h-12 w-12">
        <AvatarImage src={userAvatar || "https://api.dicebear.com/7.x/emoji/svg"} />
          <AvatarFallback className="bg-zinc-100 text-zinc-800">
            {userName}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="!font-[14px] text-zinc-800">Contribution Score</h3>
          <p className="text-sm text-[#3B35C3]">Reward Points | {}</p>
        </div>
      </div>

      {/* <Button 
        variant="outline" 
        className="mb-6 bg-[#F0EFFF] justify-start gap-2 border-[#BDBDBD] border-[0.5px] text-zinc-500 hover:bg-[#E6E5FF] hover:text-zinc-600"
        onClick={() => handleNavigation('store')}
      >
        <Plus size={16} />
        Store
      </Button> */}

      {/* Beta Feature Dialog */}
      <Dialog>
        {/* <DialogTrigger asChild>
          <Button
            size="sm"
            className="mb-6 bg-[#F0EFFF] justify-start gap-2 border-[#BDBDBD] border-[0.5px] text-zinc-500 hover:bg-[#E6E5FF] hover:text-zinc-600"
          >
            <Plus size={16} />
            Store
          </Button>
        </DialogTrigger> */}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Feature Coming Soon!</DialogTitle>
            <DialogDescription>
              This feature will be released soon in beta. For now, we encourage
              you to invite as many family members as possible to start building
              your family tree. The more members you have, the richer your
              family legacy will be!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogTrigger asChild>
              <Button variant="outline">Close</Button>
            </DialogTrigger>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`w-full text-[12px] justify-start gap-2 text-[#3B35C3] ${
              activePage === item.id ? "bg-[#F0EFFF]" : ""
            } hover:bg-[#F0EFFF] hover:text-[#3B35C3]`}
            onClick={() => handleNavigation(item.id)}
          >
            <item.icon size={16} className="text-[#3B35C3]" />
            {item.label}
          </Button>
        ))}
      </nav>



      <Card className="mt-auto relative border border-zinc-100 overflow-hidden h-[314px] bg-[#F0EFFF]/[0.53]">
        <div className="absolute bottom-0 right-0 -z-0">
          {/* <img
            src="/dashboard/familyKick.png"
            alt="Family illustration"
            className="h-[314px] w-auto object-cover translate-y-[42px] right-0"
          /> */}
        </div>
        <div className="relative z-10 h-full">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-500">
              The Street Network
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              The Street Network is a community of family members who are connected through the Street Network.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              className="w-full bg-[#F0EFFF] text-[#3B35C3] hover:bg-[#E6E5FF] hover:text-[#3B35C3] border border-[#DDDDDD] border-[0.5px]"
              onClick={() => handleNavigation("upgrade")}
            >
              <Crown size={16} className="mr-2" />
              Join The Discord
            </Button>
          </CardContent>
        </div>

        
      </Card>
    </div>
  );
}

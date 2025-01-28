"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Search,
  FileText,
  Users,
  Calendar,
  ChevronDown,
  Folder,
  GitBranch,
  Crown,
  FileImage,
  FileVideo,
  Upload,
  Camera,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useArweaveUpload } from "@/hooks/useArweaveUpload";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { RightDashboard } from "@/components/RightDashboard";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useRouter, usePathname } from "next/navigation";
import { useUserImages } from "@/hooks/useUserImages";
import Image from "next/image";
import { resourceUsage } from "process";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserDetails, Milestone } from "@/types/user";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useAccount } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useDisconnect } from 'wagmi';
import { useParams } from "next/navigation";

interface TransactionDetails {
  id: string;
  status: string;
  timestamp: string;
  size: number;
  type: string;
}

interface NewMilestone {
  date: Date | null;
  title: string;
  description: string;
}

interface ExtendedUserDetails {
  exists: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    profileImage?: string;
    profileImageId?: string;
    occupation?: string;
    phoneNumber?: string;
    birthDay?: string;
    maritalStatus?: string;
    location?: string;
    gender?: string;
    bio?: string;
    interests?: string[];
    milestones?: Milestone[];
    familyRole?: string;
    contributions?: string[];
    walletAddress?: string;
    discordTag?: string;
  };
}

const generateUniqueId = () => {
  return "id_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
};

export default function UserSettingsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const userId = params.id;
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<ExtendedUserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch user details by ID
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      if (data.success) {
        setUserDetails(data);
        // Check if this is the current user's profile
        if (session?.user?.email === data.user.email || 
            session?.user?.walletAddress === data.user.walletAddress) {
          setIsCurrentUser(true);
        }
      } else {
        console.error("Failed to fetch user:", data.error);
        router.push('/app/familyTree'); // Redirect to family tree if user not found
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push('/app/familyTree'); // Redirect on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B35C3]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <DashboardSidebar
        activePage="settings"
        onNavigate={handleNavigation}
        userName={userDetails?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userDetails?.user?.profileImage || "/dashboard/avatar.jpeg"}
        rewardPoints={10}
      />
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80} minSize={30}>
          <div className="flex-1 flex flex-col bg-white h-screen pb-10">
            <div className="p-6 border-b border-[#DDDDDD] bg-white flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-800">
                  {isCurrentUser ? "Account Settings" : `${userDetails?.user?.name}'s Profile`}
                </h1>
                <p className="text-sm text-zinc-500">
                  {isCurrentUser 
                    ? "Manage your personal information and preferences"
                    : "View member profile and information"}
                </p>
              </div>
              {isCurrentUser ? (
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/app/familyTree')}
                    className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90"
                  >
                    Back the Street
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => router.push('/app/familyTree')}
                  className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90"
                >
                  Back to Street
                </Button>
              )}
            </div>

            <div className="flex-1 p-6 bg-[#F0EFFF]/[0.1] text-black overflow-y-auto">
              <div className="max-w-3xl space-y-6">
                {/* Profile Section */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-800">Profile</h2>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl">
                    <div className="flex items-start gap-4 mb-6">
                      <Avatar className="h-20 w-20 border-2 border-[#F0EFFF]">
                        {userDetails?.user?.profileImage ? (
                          <Image
                            src={userDetails.user.profileImage}
                            alt={userDetails.user.name || "Profile"}
                            className="h-full w-full object-cover"
                            width={80}
                            height={80}
                            priority
                            unoptimized
                          />
                        ) : (
                          <AvatarFallback className="bg-[#F0EFFF] text-[#3B35C3]">
                            {userDetails?.user?.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-zinc-800">
                          {userDetails?.user?.name}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {userDetails?.user?.familyRole || "Family Member"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-zinc-600">Name</Label>
                          <p className="mt-1 text-zinc-800">{userDetails?.user?.name || "Not specified"}</p>
                        </div>
                        <div>
                          <Label className="text-zinc-600">Occupation</Label>
                          <p className="mt-1 text-zinc-800">{userDetails?.user?.occupation || "Not specified"}</p>
                        </div>
                        <div>
                          <Label className="text-zinc-600">Location</Label>
                          <p className="mt-1 text-zinc-800">{userDetails?.user?.location || "Not specified"}</p>
                        </div>
                        <div>
                          <Label className="text-zinc-600">Discord</Label>
                          <p className="mt-1 text-zinc-800">{userDetails?.user?.discordTag || "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* About Section */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-800">About</h2>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-zinc-600">Bio</Label>
                        <p className="mt-1 text-zinc-800 whitespace-pre-wrap">
                          {userDetails?.user?.bio || "No bio provided"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-zinc-600">Interests</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {userDetails?.user?.interests?.map((interest, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-[#F0EFFF] text-[#3B35C3] rounded-full text-sm"
                            >
                              {interest}
                            </span>
                          ))}
                          {(!userDetails?.user?.interests || userDetails.user.interests.length === 0) && (
                            <p className="text-zinc-500">No interests specified</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Milestones Section */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-800">Updates Of Interest</h2>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl">
                    <div className="space-y-4">
                      {userDetails?.user?.milestones?.map((milestone) => (
                        <div key={milestone._id} className="flex items-start gap-4">
                          <div className="text-sm font-medium text-[#3B35C3] min-w-[100px]">
                            {new Date(milestone.date).toLocaleDateString()}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-zinc-800">{milestone.title}</h4>
                            <p className="text-sm text-zinc-500">{milestone.description}</p>
                          </div>
                        </div>
                      ))}
                      {(!userDetails?.user?.milestones || userDetails.user.milestones.length === 0) && (
                        <p className="text-center text-zinc-500">No updates yet</p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-zinc-100 border-l border-r border-zinc-200" />
        
        <ResizablePanel defaultSize={20} minSize={25} maxSize={30}>
          <RightDashboard
            userName={userDetails?.user?.name?.split(" ")[0] || "User"}
            userAvatar={userDetails?.user?.profileImage || "/dashboard/avatar.jpeg"}
            userRole={userDetails?.user?.familyRole || "Member"}
            familyMemberCount={0}
            onInvite={() => {}}
            onSendMessage={() => {}}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

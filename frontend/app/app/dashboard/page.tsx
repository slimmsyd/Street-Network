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
  ArrowRight,
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
import { useRouter, usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useUserImages } from "@/hooks/useUserImages";
import { RightDashboard } from "@/components/RightDashboard";
import { useSession } from "next-auth/react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

interface TransactionDetails {
  id: string;
  status: string;
  timestamp: string;
  size: number;
  type: string;
}

interface UserInteraction {
  type: string;
  timestamp: string;
  channel_id: string;
  channel_name: string;
  guild_id: string;
  guild_name: string;
  command: string | null;
  message: string;
}

interface UserDetails {
  last_channel: string;
  last_guild: string;
  last_interaction: string;
  last_message: string;
  total_interactions: number;
  username: string;
}

interface UserData {
  _id: string;
  user_id: string;
  first_interaction: string;
  interactions: UserInteraction[];
  details: UserDetails;
  username: string;
  avatar: string;
  total_interactions: number;
}

interface FocusDataPoint {
  name: string;
  interactions: number;
  channels: number;
}

interface DevelopedArea {
  name: string;
  progress: number;
}

interface Meeting {
  time: string;
  title: string;
  platform: string;
  date: string;
}

interface Member {
  user_id: string;
  username: string;
  avatar?: string;
  total_interactions: number;
  last_active: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const { userProfile, isLoading: profileLoading } = useUserProfile();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>(
    {}
  );
  const [transactions, setTransactions] = useState<{
    [key: string]: TransactionDetails;
  }>({});
  const [userData, setUserData] = useState<UserData | null>(null);
  const [channelStats, setChannelStats] = useState<{ name: string; count: number }[]>([]);
  const [topUsers, setTopUsers] = useState<{ username: string; interactions: number }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [focusData, setFocusData] = useState<FocusDataPoint[]>([]);
  const [developedAreas, setDevelopedAreas] = useState<DevelopedArea[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [statsData, setStatsData] = useState({
    prioritized: { value: 0, label: '' },
    additional: { value: 0, label: '' }
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'members' | 'global'>('personal');

  const { uploadFile, uploadProgress, isUploading, error } = useArweaveUpload({
    userId: userProfile?.user?.id || "unknown",
    familyId: "family456",
  });

  const {
    images,
    isLoading: imagesLoading,
    error: imagesError,
    refreshImages,
    deleteImage,
    canUploadMore,
  } = useUserImages(userProfile?.user?.id || "");

  const router = useRouter();
  const pathname = usePathname();
  const currentMember = pathname.split("/").pop() || "me";

  useEffect(() => {
    setMounted(true);
    fetchMembers();
    if (selectedUserId) {
      console.log("Fetching data for user:", selectedUserId);
      fetchUserData(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/discord/members');
      const data = await response.json();
      setMembers(data);
      
      if (!selectedUserId && data.length > 0) {
        setSelectedUserId(data[0].user_id);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchUserData = async (userId?: string) => {
    try {
      if (!userId) {
        console.error('No userId provided');
        return;
      }

      console.log("Fetching user data for ID:", userId);
      const response = await fetch(`/api/discord/user-data?userId=${userId}`, {
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error('Error response:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
        return;
      }

      const data = await response.json();
      console.log("Received user data for ID", userId, ":", data);
      
      if (!data || data.error) {
        console.error('No user data found or error:', data.error);
        return;
      }

      setUserData(data);

      console.log("Loggin the User Data", data);
      
      // Process interaction data for the focus chart
      const interactionsByMonth: { [key: string]: { count: number, channels: Set<string> } } = {};
      data.interactions?.forEach((interaction: UserInteraction) => {
        const date = new Date(interaction.timestamp);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        
        if (!interactionsByMonth[monthKey]) {
          interactionsByMonth[monthKey] = { count: 0, channels: new Set() };
        }
        interactionsByMonth[monthKey].count++;
        interactionsByMonth[monthKey].channels.add(interaction.channel_id);
      });

      // Convert to focus chart data
      const focusChartData = Object.entries(interactionsByMonth).map(([month, stats]) => ({
        name: month,
        interactions: stats.count,
        channels: stats.channels.size,
      }));
      setFocusData(focusChartData);

      // Process channel statistics using channel_name instead of channel_id
      const channelCounts = new Map<string, number>();
      data.interactions?.forEach((interaction: UserInteraction) => {
        // Use channel_name instead of channel_id
        const channelName = interaction.channel_name || interaction.channel_id;
        const count = channelCounts.get(channelName) || 0;
        channelCounts.set(channelName, count + 1);
      });
      
      // Get top channels
      const sortedChannels = Array.from(channelCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({
          name: name.replace(/[📚🛠️📝-]/g, '').trim(), // Clean up channel name by removing emojis
          progress: Math.round((count / (data.total_interactions || 1)) * 100)
        }));
      
      console.log("Processed channel statistics:", sortedChannels);
      setDevelopedAreas(sortedChannels);

      // Process recent activity for meetings section
      const recentActivity = data.interactions
        ?.sort((a: UserInteraction, b: UserInteraction) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 4)
        .map((interaction: UserInteraction) => ({
          time: new Date(interaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: interaction.message || 'Interaction',
          platform: interaction.channel_id,
          date: new Date(interaction.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
        }));
      setMeetings(recentActivity);

      // Calculate stats for the cards
      const totalMessages = data.interactions?.length || 0;
      const uniqueChannels = new Set(data.interactions?.map((i: UserInteraction) => i.channel_id)).size;
      
      setStatsData({
        prioritized: {
          value: Math.round((totalMessages / (data.total_interactions || 1)) * 100),
          label: 'Message Rate'
        },
        additional: {
          value: Math.round((uniqueChannels / 10) * 100), // Assuming 10 is the total number of channels
          label: 'Channel Activity'
        }
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };




  if (!mounted) return null;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#FAFAFA]">
      <DashboardSidebar
        activePage="dashboard"
        onNavigate={handleNavigation}
        userName={userData?.username || "User"}
        userAvatar={userData?.avatar || ""}
        rewardPoints={userData?.total_interactions || 0}
      />
      
      <main className="flex-1 overflow-auto w-full">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
          {/* Responsive Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-10">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
                {viewMode === 'global' ? 'Community Analytics' : 'Community Members'}
              </h1>
              <p className="text-sm text-gray-500">
                {viewMode === 'global' 
                  ? 'Overall community engagement metrics' 
                  : 'Individual member activity overview'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Member Selection Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto rounded-xl border-gray-200">
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarImage src={userData?.avatar || ''} />
                      <AvatarFallback>{userData?.username?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    {userData?.username || 'Select Member'}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {members.map((member) => (
                    <DropdownMenuItem
                      key={member.user_id}
                      onClick={() => {
                        setSelectedUserId(member.user_id);
                        setViewMode('global');
                      }}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.username[0]}</AvatarFallback>
                      </Avatar>
                      {member.username}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
                <Button 
                  variant={viewMode === 'members' ? 'default' : 'ghost'} 
                  onClick={() => setViewMode('members')}
                  className="flex-1 sm:flex-none rounded-lg text-sm px-4 text-black"
                  size="sm"
                >
                  Members
                </Button>
                <Button 
                  variant={viewMode === 'global' ? 'default' : 'ghost'} 
                  onClick={() => setViewMode('global')}
                  className="flex-1 sm:flex-none rounded-lg text-sm px-4 text-black"
                  size="sm"
                >
                  Global
                </Button>
              </div>
            </div>
          </div>

          {viewMode === 'members' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {members.map((member) => (
                <Card key={member.user_id} className="bg-white/80 backdrop-blur-xl border-0 shadow-sm rounded-2xl hover:shadow-md transition-all">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                          {member.username}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="secondary" className="rounded-full text-xs">
                            {member.total_interactions} interactions
                          </Badge>
                          <span className="text-xs text-gray-400">
                            Active {new Date(member.last_active).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="rounded-xl hidden sm:flex"
                        onClick={() => {
                          setSelectedUserId(member.user_id);
                          setViewMode('global');
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Stats Overview - Full width on mobile */}
              <div className="col-span-full grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-xl">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Interactions</p>
                    <h3 className="text-xl sm:text-2xl font-semibold mt-1 text-black">
                      {userData?.total_interactions || 0}
                    </h3>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-green-50 rounded-xl">
                        <GitBranch className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Active Channels</p>
                    <h3 className="text-xl sm:text-2xl font-semibold mt-1 text-black">
                      {new Set(userData?.interactions?.map(i => i.channel_id)).size || 0}
                    </h3>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-purple-50 rounded-xl">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Days Active</p>
                    <h3 className="text-xl sm:text-2xl font-semibold mt-1 text-black">
                      {userData?.interactions?.reduce((uniqueDays, interaction) => {
                        const day = new Date(interaction.timestamp).toDateString();
                        uniqueDays.add(day);
                        return uniqueDays;
                      }, new Set()).size || 0}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Since Feb 6, 2024</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-orange-50 rounded-xl">
                        <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Engagement Rate</p>
                    <h3 className="text-xl sm:text-2xl font-semibold mt-1 text-black">
                      {statsData.prioritized.value}%
                    </h3>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Chart - Full width on mobile */}
              <div className="col-span-full lg:col-span-8">
                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm sm:text-base font-medium text-gray-900">Activity Overview</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Monthly interaction analytics</p>
                      </div>
                    </div>
                    <div className="h-[250px] sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={focusData}>
                          <defs>
                            <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" stroke="#9CA3AF" />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'rgba(255, 255, 255, 0.8)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="interactions" 
                            stroke="#4F46E5" 
                            strokeWidth={2}
                            fill="url(#colorInteractions)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Side Cards - Stack on mobile */}
              <div className="col-span-full lg:col-span-4 space-y-4 sm:space-y-6">
                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {meetings.slice(0, 3).map((meeting, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-xl">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {meeting.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{meeting.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-4">Channel Activity</h3>
                    <div className="space-y-4">
                      {developedAreas.slice(0, 4).map((area, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs sm:text-sm text-gray-600">{area.name}</span>
                            <span className="text-xs sm:text-sm text-gray-500">{area.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${area.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
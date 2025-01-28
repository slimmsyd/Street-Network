'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Plus } from "lucide-react";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { RightDashboardProps } from '@/types/user';
import { InviteMemberDialog } from './InviteMemberDialog';

interface Workspace {
  workspaceId: {
    _id: string;
    name: string;
  };
  role: string;
}

interface WorkspaceMember {
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  role: string;
  familyRole: string;
  joinedAt: string;
}

export function RightDashboard({ userName, userAvatar, userRole, familyMemberCount, onInvite, onSendMessage }: RightDashboardProps) {
  const { data: session } = useSession();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [isSettingRelation, setIsSettingRelation] = useState(false);
  const [visibleMemberCount, setVisibleMemberCount] = useState(5); // Show initial 5 members
  const [messages, setMessages] = useState<Array<{id: string; sender: string; text: string; isAI?: boolean}>>([
    {
      id: '1',
      sender: 'Lineage AI',
      text: 'Welcome to your Street Network! I\'m here to help you connect with your community.',
      isAI: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`/api/users/email/${encodeURIComponent(session?.user?.email || '')}`);
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
      }

      

    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchCurrentUser();
    }
  }, [session]);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch(`/api/users/workspaces?email=${encodeURIComponent(session?.user?.email || '')}`);
      const data = await response.json();

      console.log("loggin the session email", session?.user?.email);

      console.log("Fetching workspaces hereeee", data);
      if (data.success) {
        setWorkspaces(data.workspaces);
        console.log("Workspaces:", data.workspaces);
        // If we have workspaces, fetch members of the first workspace
        if (data.workspaces.length > 0) {
          fetchWorkspaceMembers(data.workspaces[0].workspaceId._id);
        }


        console.log("Loggin the workspaces", data.workspaces);


      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkspaceMembers = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      const data = await response.json();
      
      if (data.success) {
        // Create a Set to track unique member IDs
        const uniqueMembers = new Map<string, WorkspaceMember>();
        
        // Filter out duplicates and current user
        data.workspace.members.forEach((member: any) => {
          if (member.userId !== currentUser?.id) {
            uniqueMembers.set(member.userId._id || member.userId, {
              userId: member.userId._id || member.userId,
              name: member.userId.name || member.name,
              email: member.userId.email || member.email,
              profileImage: member.userId.profileImage || member.profileImage,
              role: member.role || 'member',
              familyRole: member.userId.familyRole,
              joinedAt: member.joinedAt,
            });
          }
        });

        // Convert Map back to array
        const filteredMembers = Array.from(uniqueMembers.values());
        setWorkspaceMembers(filteredMembers);
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error);
    }
  };

  const handleViewMore = () => {
    setVisibleMemberCount(prev => prev + 5); // Show 5 more members
  };

  useEffect(() => {
    if (session?.user?.email) {
      console.log("Fetching workspaces with email:", session.user.email);
      fetchWorkspaces();
    }
  }, [session?.user?.email]);

  // Refetch workspace members when currentUser changes
  useEffect(() => {
    if (workspaces.length > 0 && currentUser) {
      fetchWorkspaceMembers(workspaces[0].workspaceId._id);
    }
  }, [workspaces, currentUser]);

  const getInitials = (name: string | undefined) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleWorkspaceCreated = () => {
    console.log("Workspace created", workspaces);
    fetchWorkspaces();
  };

  const handleSetRelation = async (memberId: string, relation: string) => {
    try {
      const response = await fetch(`/api/users/${currentUser?.id}/relationships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          relatedUserId: memberId,
          relationship: relation
        }),
      });

      const data = await response.json();
      console.log("Response from setting relation:", data);

      if (data.success) {
        // Refresh the workspace members to show updated relationships
        if (workspaces.length > 0) {
          fetchWorkspaceMembers(workspaces[0].workspaceId._id);
        }
        setIsSettingRelation(false);
      }
    } catch (error) {
      console.error('Error setting relation:', error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: userName || 'You',
      text: newMessage
    };
    setMessages(prev => [...prev, userMessage]);

    // Add AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'Lineage AI',
        text: "I'm here to help you connect with your community. (This is a placeholder response)",
        isAI: true
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setNewMessage('');
  };

  // if (isLoading) {
  //   return <div className="h-full border-l border-zinc-200 p-4">Loading...</div>;
  // }

 
    return (
      <div className="h-full border-l border-zinc-200 p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Avatar>
          <AvatarImage src={userAvatar || "/dashboard/avatar.jpeg"} />
          <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            {userName ? getInitials(userName) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium !text-black">Hello, {userName?.split(' ')[0]}</div>
          <div className="text-sm !text-black">{userRole || 'Member'}</div>
        </div>
      </div>

      {/* Chat Box */}
      <Card className="flex-1 min-h-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/10 backdrop-blur-sm flex flex-col">
        <CardHeader className="py-2 px-3 flex-shrink-0">
          <CardTitle className="text-xs font-medium text-zinc-300 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Street Network Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 rounded-md bg-black/20 border border-purple-400/10 backdrop-blur-sm p-2 overflow-y-auto">
            <div className="space-y-2">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-start gap-2 ${message.isAI ? 'opacity-80' : ''}`}>
                  <Avatar className="h-6 w-6 border border-purple-400/20">
                    <AvatarFallback className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                      {message.isAI ? 'AI' : getInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-400 mb-0.5">{message.sender}</p>
                    <div className="inline-block rounded-lg bg-white/5 px-2 py-1 text-xs text-zinc-300">
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0 mt-3">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 h-8 bg-black/20 border-purple-400/20 text-zinc-300 text-sm placeholder:text-zinc-600"
              placeholder="Ask me anything about your community..."
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              className="h-8 px-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-none focus:shadow-none active:shadow-none"
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    );

  return (
    <div className="h-full border-l border-zinc-200 p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Avatar>
          <AvatarImage src={userAvatar || "/dashboard/avatar.jpeg"} />
          <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            {userName ? getInitials(userName) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium !text-black">Hello, {userName?.split(' ')[0]}</div>
          <div className="text-sm !text-black">{userRole || 'Member'}</div>
        </div>
      </div>

      {/* Chat Box */}
      <Card className="flex-1 min-h-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/10 backdrop-blur-sm flex flex-col">
        <CardHeader className="py-2 px-3 flex-shrink-0">
          <CardTitle className="text-xs font-medium text-zinc-300 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Street Network Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 rounded-md bg-black/20 border border-purple-400/10 backdrop-blur-sm p-2 overflow-y-auto">
            <div className="space-y-2">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-start gap-2 ${message.isAI ? 'opacity-80' : ''}`}>
                  <Avatar className="h-6 w-6 border border-purple-400/20">
                    <AvatarFallback className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                      {message.isAI ? 'AI' : getInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-400 mb-0.5">{message.sender}</p>
                    <div className="inline-block rounded-lg bg-white/5 px-2 py-1 text-xs text-zinc-300">
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0 mt-3">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 h-8 bg-black/20 border-purple-400/20 text-zinc-300 text-sm placeholder:text-zinc-600"
              placeholder="Ask me anything about your community..."
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              className="h-8 px-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-none focus:shadow-none active:shadow-none"
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
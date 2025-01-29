"use client"

import { useRouter, usePathname } from 'next/navigation';
import { FamilyTree } from '@/components/FamilyTree';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { RightDashboard } from '@/components/RightDashboard';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function FamilyTreePage() {
  const { data: session } = useSession();
  
  const router = useRouter();
  const pathname = usePathname();
  const currentMember = pathname.split('/').pop() || 'me';
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchTotalUsers = async () => {
    try {
      const response = await fetch('/api/users/all');
      const data = await response.json();
      if (data.success) {
        setTotalUsers(data.users.length);
      }
    } catch (error) {
      console.error('Error fetching total users:', error);
    }
  };

  useEffect(() => {
    fetchTotalUsers();
  }, []);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const email = session?.user?.email;
      const walletAddress = session?.user?.walletAddress;

      if (!email && !walletAddress) {
        console.log("No authentication credentials found");
        setIsLoading(false);
        return;
      }

      // Determine which endpoint to use based on available credentials
      let endpoint;
      if (walletAddress) {
        endpoint = `/api/users/wallet/${encodeURIComponent(walletAddress)}`;
      } else if (email) {
        endpoint = `/api/users/email/${encodeURIComponent(email)}`;
      } else {
        throw new Error("No authentication method available");
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        console.log("User details:", data);
        setUserDetails(data);
      } else {
        console.error("Failed to fetch user:", data.error);
        setUserDetails({
          exists: false,
          user: {
            id: "",
            email: email || "",
            walletAddress: walletAddress || "",
            name: "User",
            milestones: [],
          },
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUserDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const handleNodeClick = (nodeId: string) => {
    router.push(`/app/familyTree/${nodeId}`);
  };

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  const handleInvite = () => {
    // Handle invite functionality
    console.log('Invite clicked');
  };

  const handleSendMessage = () => {
    // Handle sending message
    console.log('Message clicked');
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <DashboardSidebar
        activePage="familyTree"
        onNavigate={handleNavigation}
        userName={userDetails?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userDetails?.user?.profileImage || ""}
        rewardPoints={10}
      />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={80} minSize={30} className="flex-1">
          <div className="container mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-violet-50 to-white p-6 rounded-2xl shadow-sm border border-violet-100/20 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-zinc-600 text-sm font-medium">Street Members</h3>
                  <span className="bg-violet-100 text-violet-600 text-xs px-2 py-1 rounded-full">Growing</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-violet-600">{totalUsers}</span>
                  <span className="text-green-500 text-sm">Active</span>
                </div>
                <p className="text-zinc-500 text-xs mt-2">Active members in the network</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-white shadow-lg" style={{ height: 'calc(100vh - 280px)' }}>
              <FamilyTree 
                currentPage={currentMember}
                onNodeClick={handleNodeClick}
                className="w-full h-full"
                userProfileImage={userDetails?.user?.profileImage}
              />
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="hidden md:flex bg-zinc-100 border-l border-r border-zinc-200" />
        
        <ResizablePanel defaultSize={20} minSize={25} maxSize={30} className="hidden md:block">
          <RightDashboard
            userName={userDetails?.user?.name?.split(' ')[0] || "User"}
            userAvatar={userDetails?.user?.profileImage || ""}
            userRole={userDetails?.user?.familyRole || "Member"}
            familyMemberCount={0}
            onInvite={handleInvite}
            onSendMessage={handleSendMessage}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 
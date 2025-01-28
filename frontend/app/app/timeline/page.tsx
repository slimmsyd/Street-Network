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
  MoreHorizontal,
  MapPin,
  ChevronLeft,
  ChevronRight,
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
import { useState, useEffect, useRef } from "react";
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
import * as d3 from "d3";

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

interface TimelineEvent {
  date: Date;
  title: string;
  type: string;
  description: string;
}

const generateUniqueId = () => {
  return "id_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
};

function TimelineHeader({ events }: { events: TimelineEvent[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('year');
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 200; // Adjust scroll amount as needed
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      containerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !events.length) return;

    const margin = { top: 20, right: 100, bottom: 20, left: 100 };
    const width = Math.max(events.length * 150, svgRef.current.clientWidth);
    const height = 120 - margin.top - margin.bottom;

    // Clear previous content
    const svg = d3.select(svgRef.current as SVGSVGElement);
    svg.selectAll("*").remove();

    const mainGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales with more space between events
    const timeScale = d3.scaleTime()
      .domain(d3.extent(events, d => d.date) as [Date, Date])
      .range([0, width - margin.left - margin.right]);

    // Create the timeline line
    mainGroup.append("line")
      .attr("x1", 0)
      .attr("x2", width - margin.left - margin.right)
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", "#DDDDDD")
      .attr("stroke-width", 2);

    // Add nodes
    const nodes = mainGroup.selectAll("circle")
      .data(events)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${timeScale(d.date)},${height/2})`);

    // Add circles for nodes with hover effect
    nodes.append("circle")
      .attr("r", 6)
      .attr("fill", d => {
        switch(d.type) {
          case 'milestone': return '#3B35C3';
          case 'photo': return '#00A3FF';
          case 'document': return '#FF6B6B';
          default: return '#94A3B8';
        }
      })
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-all duration-200 hover:scale-150");

    // Add date labels
    nodes.append("text")
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("class", "text-xs text-zinc-600")
      .text(d => d3.timeFormat(selectedPeriod === 'month' ? '%b %d' : '%b %Y')(d.date));

    // Add event titles
    nodes.append("text")
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("class", "text-xs font-medium text-zinc-800")
      .text(d => d.title.length > 15 ? d.title.substring(0, 15) + '...' : d.title);

    // Add invisible hover area for better interaction
    nodes.append("rect")
      .attr("x", -50)
      .attr("y", -30)
      .attr("width", 100)
      .attr("height", 60)
      .attr("fill", "transparent")
      .attr("class", "cursor-pointer")
      .on("mouseover", function(event, d) {
        // Show tooltip with full information
        d3.select(this.parentNode as HTMLElement)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", 8);
      })
      .on("mouseout", function(event, d) {
        d3.select(this.parentNode as HTMLElement)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", 6);
      });

  }, [events, selectedPeriod]);

  return (
    <div className="w-full bg-white border-b border-[#DDDDDD]">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-zinc-800 opacity-0">Timeline</h1>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
              className={selectedPeriod === 'month' ? 'bg-[#3B35C3]' : ''}
            >
              Month View
            </Button>
            <Button
              variant={selectedPeriod === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('year')}
              className={selectedPeriod === 'year' ? 'bg-[#3B35C3]' : ''}
            >
              Year View
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div 
            ref={containerRef}
            className="overflow-x-auto scrollbar-hide relative"
            style={{ 
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            <svg
              ref={svgRef}
              className="w-full min-w-[800px]"
              style={{ height: '120px' }}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3B35C3]" />
            <span className="text-zinc-600">Milestones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00A3FF]" />
            <span className="text-zinc-600">Photos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF6B6B]" />
            <span className="text-zinc-600">Documents</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>(
    {}
  );
  const [transactions, setTransactions] = useState<{
    [key: string]: TransactionDetails;
  }>({});
  const [selectedRole, setSelectedRole] = useState<string>("historian");
  const [customRole, setCustomRole] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<string, boolean>
  >({});

  const [newMilestone, setNewMilestone] = useState<NewMilestone>({
    date: null,
    title: "",
    description: "",
  });
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [editedMilestone, setEditedMilestone] = useState<Milestone | null>(
    null
  );
  const [newInterest, setNewInterest] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const currentMember = pathname.split("/").pop() || "me";

  const {
    images,
    isLoading: imagesLoading,
    error: imagesError,
    refreshImages,
    deleteImage,
    canUploadMore,
  } = useUserImages(userDetails?.user?.id || "");

  const handleNodeClick = (nodeId: string) => {
    router.push(`/app/familyTree/${nodeId}`);
  };

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  const handleRoleSelect = (value: string) => {
    setSelectedRole(value);
    setCustomRole("");
    setSearchValue("");
  };

  const handleCustomRoleSubmit = (value: string) => {
    if (value.trim()) {
      setCustomRole(value.trim());
      setSelectedRole("");
      setSearchValue("");
    }
  };

  const currentRole = customRole || selectedRole;

  const { uploadFile, uploadProgress, isUploading, error } = useArweaveUpload({
    userId: "user123",
    familyId: "family456",
  });

  const handleUploadToArweave = async () => {
    for (const file of selectedFiles) {
      try {
        setUploadStatus((prev) => ({ ...prev, [file.name]: "uploading" }));
        const result = await uploadFile(file);

        if (result.status === "success") {
          setUploadStatus((prev) => ({ ...prev, [file.name]: "success" }));

          // Store transaction details
          setTransactions((prev) => ({
            ...prev,
            [file.name]: {
              id: result.transactionId,
              status: "success",
              timestamp: new Date().toISOString(),
              size: file.size,
              type: file.type,
            },
          }));

          // Log detailed information
          console.log("Transaction Details:", {
            fileName: file.name,
            transactionId: result.transactionId,
            fileSize: `${(file.size / 1024).toFixed(2)} KB`,
            fileType: file.type,
            timestamp: new Date().toISOString(),
          });
        } else {
          setUploadStatus((prev) => ({ ...prev, [file.name]: "error" }));
          console.error(`Failed to upload ${file.name}:`, result.message);
        }
      } catch (err) {
        setUploadStatus((prev) => ({ ...prev, [file.name]: "error" }));
        console.error(`Error uploading ${file.name}:`, err);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const fetchUserDetails = async () => {

    setIsLoading(true);
    try {
      const email = session?.user?.email;
      console.log("Logging the email in the fetchUserDetails function:", email);
      if (!email) {
        console.log("No email found in session");
        return;
      }
      const response = await fetch(
        `/api/users/email/${encodeURIComponent(email)}`
      );
      const data = await response.json();

      console.log("User details:", data);

      if (data.success) {
        console.log("User details:", data);
        setUserDetails(data);
      } else {
        console.error("Failed to fetch user:", data.error);
        setUserDetails({
          exists: false,
          user: {
            id: "",
            email: email as string,
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
    console.log("Fetching user details");
      fetchUserDetails();
  }, []); // Add status to dependency array

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: Record<string, string>) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setHasChanges(false);
    setFormData({});
    // Reset all form fields to original values
    fetchUserDetails();
  };

  const handleSave = async () => {
    if (!userDetails) return;

    try {
      const response = await fetch(`/api/users/${userDetails.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          isAddingMilestone: isAddingMilestone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditMode(false);
        setHasChanges(false);
        setFormData({});
        // Refresh user details
        fetchUserDetails();
      } else {
        console.error("Failed to update profile:", data.error);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !userDetails) return;

    if (!canUploadMore) {
      alert(
        "You can only upload a maximum of 6 images. Please delete some images first."
      );
      return;
    }

    try {
      setIsImageUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userDetails.user.id);
      formData.append("type", "profile");

      // Upload to GridFS
      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const gridFsUrl = `/api/images/${data.fileId}`;

        // Update user's profile in database with all existing fields plus new image URL
        const updateResponse = await fetch(
          `/api/users/${userDetails.user.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...userDetails.user, // Keep all existing user details
              profileImage: gridFsUrl, // Update with new GridFS URL
              profileImageId: data.fileId,
            }),
          }
        );

        if (!updateResponse.ok) {
          throw new Error("Failed to update profile image");
        }

        // Fetch fresh user details to ensure we have the latest data
        await fetchUserDetails();

        // Set as selected image in the grid
        setSelectedImage(data.fileId);

        // Refresh the images list
        refreshImages();
      } else {
        console.error("Failed to upload image:", data.error);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleAddMilestone = () => {
    if (!newMilestone.date || !newMilestone.title || !userDetails) return;

    const updatedMilestones = [
      ...(userDetails.user.milestones || []),
      {
        ...newMilestone,
        _id: generateUniqueId(),
        date: format(newMilestone.date, "yyyy/MM/dd"),
      },
    ];

    setFormData((prev) => ({
      ...prev,
      milestones: updatedMilestones,
    }));

    setUserDetails({
      ...userDetails,
      user: {
        ...userDetails.user,
        milestones: updatedMilestones,
      },
    });

    setNewMilestone({ date: null, title: "", description: "" });
    setIsAddingMilestone(false);
    setHasChanges(true);
  };

  const handleUpdateMilestone = (
    milestoneId: string,
    updatedData: Partial<Omit<Milestone, "_id">>
  ) => {
    if (!userDetails) return;

    const updatedMilestones = (userDetails.user.milestones || []).map(
      (milestone) =>
        milestone._id === milestoneId
          ? { ...milestone, ...updatedData }
          : milestone
    );

    setFormData((prev) => ({
      ...prev,
      milestones: updatedMilestones,
    }));

    setUserDetails({
      ...userDetails,
      user: {
        ...userDetails.user,
        milestones: updatedMilestones,
      },
    });

    setEditingMilestone(null);
    setHasChanges(true);
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!userDetails) return;

    const updatedMilestones = (userDetails.user.milestones || []).filter(
      (milestone) => milestone._id !== milestoneId
    );

    setFormData((prev) => ({
      ...prev,
      milestones: updatedMilestones,
    }));

    setUserDetails({
      ...userDetails,
      user: {
        ...userDetails.user,
        milestones: updatedMilestones,
      },
    });

    setHasChanges(true);
  };

  const handleMilestoneEdit = (field: keyof Milestone, value: string) => {
    if (editedMilestone) {
      setEditedMilestone({
        ...editedMilestone,
        [field]: value,
      });
    }
  };

  const handleAddInterest = () => {
    if (!newInterest.trim() || !userDetails) return;

    const updatedInterests = [
      ...(userDetails.user.interests || []),
      newInterest.trim(),
    ];

    setFormData((prev) => ({
      ...prev,
      interests: updatedInterests,
    }));

    setUserDetails({
      ...userDetails,
      user: {
        ...userDetails.user,
        interests: updatedInterests,
      },
    });

    setNewInterest("");
    setHasChanges(true);
  };

  const handleDeleteInterest = (interestToDelete: string) => {
    if (!userDetails) return;

    const updatedInterests = (userDetails.user.interests || []).filter(
      (interest) => interest !== interestToDelete
    );

    setFormData((prev) => ({
      ...prev,
      interests: updatedInterests,
    }));

    setUserDetails({
      ...userDetails,
      user: {
        ...userDetails.user,
        interests: updatedInterests,
      },
    });

    setHasChanges(true);
  };

  // Add sample timeline events (replace with real data later)
  const timelineEvents: TimelineEvent[] = [
    {
      date: new Date('2024-01-15'),
      title: "Family Reunion",
      type: "milestone",
      description: "Annual family gathering"
    },
    {
      date: new Date('2024-02-01'),
      title: "Wedding Photos",
      type: "photo",
      description: "Sarah and John's wedding"
    },
    {
      date: new Date('2024-02-15'),
      title: "Birth Certificate",
      type: "document",
      description: "Baby Emma's birth certificate"
    },
    // Add more events as needed
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Sidebar */}
      <DashboardSidebar
        activePage="timeline"
        onNavigate={handleNavigation}
        userName={userDetails?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userDetails?.user?.profileImage || "/dashboard/avatar.jpeg"}
        rewardPoints={10}
      />
      {/* Main Content and Right Sidebar */}
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80} minSize={30}>
          <div className="flex-1 flex flex-col bg-white h-screen pb-10">
            <TimelineHeader events={timelineEvents} />
            
            <div
              className="flex-1 p-6 bg-[#F0EFFF]/[0.1] text-black overflow-y-auto"
              style={{
                msOverflowStyle: "none",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              
              {/* Post Creation Card */}
              <Card className="mb-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-[#F0EFFF]">
                      {userDetails?.user?.profileImage ? (
                        <Image
                          src={userDetails.user.profileImage}
                          alt={userDetails.user.name || "Profile"}
                          className="h-full w-full object-cover"
                          width={40}
                          height={40}
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
                    <Input
                      placeholder="Share or ask something to everyone!"
                      className="flex-1 border-none bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:ring-0"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#DDDDDD] pt-4">
                    <div className="flex gap-4">
                      <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-[#3B35C3] hover:bg-[#F0EFFF]">
                        <Camera className="h-5 w-5 mr-2" />
                        Camera
                      </Button>
                      <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-[#3B35C3] hover:bg-[#F0EFFF]">
                        <FileImage className="h-5 w-5 mr-2" />
                        Images
                      </Button>
                      <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-[#3B35C3] hover:bg-[#F0EFFF]">
                        <FileVideo className="h-5 w-5 mr-2" />
                        Videos
                      </Button>
                      <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-[#3B35C3] hover:bg-[#F0EFFF]">
                        <FileText className="h-5 w-5 mr-2" />
                        Files
                      </Button>
                      <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-[#3B35C3] hover:bg-[#F0EFFF]">
                        <MapPin className="h-5 w-5 mr-2" />
                        Location
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Timeline Posts */}
              <div className="space-y-6">
                {/* Example Post */}
                <Card className="border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-[#F0EFFF]">
                          <AvatarFallback className="bg-[#F0EFFF] text-[#3B35C3]">
                            JS
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-sm font-medium text-zinc-800">Jonathan</h3>
                          <p className="text-xs text-zinc-500">Just Now</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5 text-zinc-500" />
                      </Button>
                    </div>
                    <p className="text-sm text-zinc-600 mb-4">
                      Hi gaes, today, I'm bringing you a UI design for Logistic Website.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-[#F0EFFF] text-[#3B35C3] rounded-full text-xs">
                        #Website
                      </span>
                      <span className="px-3 py-1 bg-[#F0EFFF] text-[#3B35C3] rounded-full text-xs">
                        #UI/UX
                      </span>
                      <span className="px-3 py-1 bg-[#F0EFFF] text-[#3B35C3] rounded-full text-xs">
                        #Design
                      </span>
                      <span className="px-3 py-1 bg-[#F0EFFF] text-[#3B35C3] rounded-full text-xs">
                        #LandingPage
                      </span>
                    </div>
                    <div className="rounded-xl overflow-hidden">
                      <Image
                        src="/timeline/post-image.jpg"
                        alt="Post image"
                        width={800}
                        height={400}
                        className="w-full object-cover"
                        priority
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-zinc-100 border-l border-r border-zinc-200"
        />

        <ResizablePanel defaultSize={20} minSize={25} maxSize={30}>
          <RightDashboard
            userName={userDetails?.user?.name?.split(" ")[0] || "User"}
            userAvatar={userDetails?.user?.profileImage || ""}
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

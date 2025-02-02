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
import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

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

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

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
  const [userDetails, setUserDetails] = useState<ExtendedUserDetails | null>(null);
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


  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const email = session?.user?.email;
      const walletAddress = address; // Using address from useAccount
      
      console.log("User auth details:", { email, walletAddress });
      
      if (!email && !walletAddress) {
        console.log("No email or wallet address found");
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

      console.log("User details response:", data);

      if (data.success) {
        setUserDetails(data);
        // If we found a user by wallet but they don't have a wallet address saved, update it
        if (walletAddress && !data.user.walletAddress) {
          const updateResponse = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress,
            }),
        });
          const updateData = await updateResponse.json();
          if (updateData.success) {
            setUserDetails(updateData);
          }
        }
      } else {
        console.error("Failed to fetch user:", data.error);
        // Create a minimal user object for new users
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
    if (session?.user?.email || isConnected) {
      fetchUserDetails();
    }
  }, [session, isConnected]); // Changed from address to isConnected

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
      // Determine which endpoint to use based on available credentials
      let endpoint;
      if (userDetails.user.walletAddress) {
        endpoint = `/api/users/wallet/${encodeURIComponent(userDetails.user.walletAddress)}`;
      } else if (userDetails.user.email) {
        endpoint = `/api/users/email/${encodeURIComponent(userDetails.user.email)}`;
      } else {
        throw new Error("No authentication method available");
      }

      const response = await fetch(endpoint, {
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
        setIsAddingMilestone(false);
        // Refresh user details
        await fetchUserDetails();
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

        // Determine which endpoint to use based on available credentials
        let endpoint;
        if (userDetails.user.walletAddress) {
          endpoint = `/api/users/wallet/${encodeURIComponent(userDetails.user.walletAddress)}`;
        } else if (userDetails.user.email) {
          endpoint = `/api/users/email/${encodeURIComponent(userDetails.user.email)}`;
        } else {
          throw new Error("No authentication method available");
        }

        // Update user's profile in database with all existing fields plus new image URL
        const updateResponse = await fetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...userDetails.user,
            profileImage: gridFsUrl,
            profileImageId: data.fileId,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to update profile image");
        }

        const updateData = await updateResponse.json();
        if (updateData.success) {
          // Fetch fresh user details to ensure we have the latest data
          await fetchUserDetails();

          // Set as selected image in the grid
          setSelectedImage(data.fileId);

          // Refresh the images list
          refreshImages();
        } else {
          throw new Error(updateData.error || "Failed to update profile image");
        }
      } else {
        throw new Error(data.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(error instanceof Error ? error.message : "Failed to upload image");
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
    setIsAddingMilestone(true);  // Keep this true until save completes
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

  const handleConnectWallet = async () => {
    try {
      await open();
    } catch (error) {
      console.error('Failed to open Web3Modal:', error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordStatus = params.get('discord');
    
    if (discordStatus === 'success') {
      alert('Discord account connected successfully!');
      // Remove the query parameter
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh user details
      fetchUserDetails();
    } else if (discordStatus === 'error') {
      alert('Failed to connect Discord account. Please try again.');
      // Remove the query parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (!mounted) {
    return null; // or loading spinner
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <DashboardSidebar
        activePage="settings"
        onNavigate={handleNavigation}
        userName={userDetails?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userDetails?.user?.profileImage || ""}
        rewardPoints={10}
      />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={80} minSize={30} className="flex-1">
          <div className="flex-1 flex flex-col bg-white h-screen pb-10">
            <div className="p-6 border-b border-[#DDDDDD] bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-800">
                  Account Settings
                </h1>
                <p className="text-sm text-zinc-500">
                  Manage your personal information and preferences
                </p>
              </div>
              {!isEditMode ? (
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    onClick={isConnected ? handleDisconnectWallet : handleConnectWallet}
                    className={isConnected ? "text-red-500 hover:text-red-600" : "bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90"}
                  >
                    {isConnected ? `Disconnect Wallet (${address?.slice(0, 6)}...${address?.slice(-4)})` : "Connect Wallet"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-600 hover:text-red-700 bg-transparent hover:bg-red-50"
                  >
                    Log Out
                  </Button>
                  <Button
                    onClick={() => setIsEditMode(true)}
                    className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90 transition-colors duration-200"
                  >
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-none text-[#3B35C3] bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`${
                      hasChanges
                        ? "bg-[#3B35C3] hover:bg-[#3B35C3]/90"
                        : "bg-gray-300 cursor-not-allowed"
                    } text-white transition-colors duration-200`}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 p-6 bg-[#F0EFFF]/[0.1] text-black overflow-y-auto">
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="max-w-3xl space-y-6">
                {/* General Section */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-800">General</h2>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl">
                    <div className="flex items-start gap-4 mb-6">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative group cursor-pointer">
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
                                    .join("") || "SS"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Profile Images</DialogTitle>
                            <DialogDescription>
                              Choose a profile image or upload a new one
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-3 gap-4 py-4">
                            {imagesLoading ? (
                              Array(3)
                                .fill(0)
                                .map((_, i) => (
                                  <div
                                    key={i}
                                    className="aspect-square rounded-lg bg-gray-100 animate-pulse"
                                  />
                                ))
                            ) : imagesError ? (
                              <div className="col-span-3 text-red-500 text-sm">
                                {imagesError}
                              </div>
                            ) : images.length === 0 ? (
                              <div className="col-span-3 text-center py-8 text-gray-500">
                                No images uploaded yet
                              </div>
                            ) : (
                              images.map((image) => (
                                <button
                                  key={image.id}
                                  className={`relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-[#3B35C3] focus:outline-none focus:ring-2 focus:ring-[#3B35C3] ${
                                    imageLoadingStates[image.id]
                                      ? "animate-pulse bg-gray-100"
                                      : ""
                                  } ${
                                    selectedImage === image.id
                                      ? "ring-2 ring-[#3B35C3]"
                                      : ""
                                  }`}
                                  onClick={async () => {
                                    if (imageLoadingStates[image.id]) return;
                                    setSelectedImage(image.id);

                                    try {
                                      // Update formData with the new image information
                                      setFormData((prev) => ({
                                        ...prev,
                                        profileImage: image.url,
                                        profileImageId: image.id,
                                      }));
                                      setHasChanges(true); // Indicate that changes have been made

                                      // Update local state immediately for UI feedback
                                      setUserDetails((prev: any) => ({
                                        ...prev,
                                        user: {
                                          ...prev.user,
                                          profileImage: image.url,
                                          profileImageId: image.id,
                                        },
                                      }));
                                    } catch (error) {
                                      console.error(
                                        "Error updating profile image:",
                                        error
                                      );
                                      setSelectedImage(null);
                                    }
                                  }}
                                  disabled={imageLoadingStates[image.id]}
                                >
                                  <div className="relative w-full h-full group">
                                    <Image
                                      src={image.url}
                                      alt={image.filename}
                                      className="w-full h-full object-cover"
                                      width={150}
                                      height={150}
                                      onLoad={() => {
                                        setImageLoadingStates((prev) => ({
                                          ...prev,
                                          [image.id]: false,
                                        }));
                                      }}
                                      priority={selectedImage === image.id}
                                      unoptimized
                                    />
                                    {isEditMode && (
                                      <button
                                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={async (e) => {
                                          e.stopPropagation(); // Prevent image selection
                                          if (
                                            confirm(
                                              "Are you sure you want to delete this image?"
                                            )
                                          ) {
                                            const success = await deleteImage(
                                              image.id
                                            );
                                            if (
                                              success &&
                                              image.id ===
                                                userDetails?.user
                                                  ?.profileImageId
                                            ) {
                                              // If deleted image was profile image, reset it
                                              setFormData((prev) => ({
                                                ...prev,
                                                profileImage: "",
                                                profileImageId: "",
                                              }));
                                              setUserDetails((prev: any) => ({
                                                ...prev,
                                                user: {
                                                  ...prev.user,
                                                  profileImage: "",
                                                  profileImageId: "",
                                                },
                                              }));
                                            }
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4 text-white" />
                                      </button>
                                    )}
                                  </div>
                                  {userDetails?.user &&
                                    userDetails.user.profileImageId ===
                                      image.id && (
                                      <div className="absolute inset-0 bg-[#3B35C3] bg-opacity-20 flex items-center justify-center">
                                        <Check className="w-6 h-6 text-white" />
                                      </div>
                                    )}
                                </button>
                              ))
                            )}
                            {!canUploadMore && (
                              <div className="col-span-3 text-center py-4 text-red-500 text-sm">
                                Maximum image limit reached (6 images). Please
                                delete some images to upload more.
                              </div>
                            )}
                          </div>
                          <DialogFooter className="sm:justify-between">
                            <div className="relative flex items-center gap-2">
                              <input
                                type="file"
                                id="profileImage"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={!isEditMode || isImageUploading}
                              />
                  <Button
                    variant="outline"
                                size="sm"
                                className={`border-[#DDDDDD] border-[0.5px] hover:bg-[#F0EFFF] hover:text-[#3B35C3] ${
                                  !isEditMode && "opacity-50 cursor-not-allowed"
                                }`}
                                onClick={() =>
                                  document
                                    .getElementById("profileImage")
                                    ?.click()
                                }
                                disabled={!isEditMode || isImageUploading}
                  >
                                {isImageUploading ? (
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#3B35C3] border-t-transparent"></div>
                                    <span>Uploading...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload New
                                  </div>
                                )}
                              </Button>
                              <Button
                    variant="outline"
                                size="sm"
                                onClick={() => handleSave()}
                                className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90 transition-colors duration-200"
                  >
                                Save
                  </Button>
                </div>
                            {imagesError && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={refreshImages}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                              </Button>
              )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-zinc-800 mb-1">
                          Profile Picture
                        </h3>
                        <p className="text-sm text-zinc-500 mb-2">
                          This will be displayed on your profile
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-white text-black">
                  <div>
                        <Label htmlFor="fullName" className="text-zinc-600">
                          Full Name
                        </Label>
                    <Input
                          id="fullName"
                          defaultValue={userDetails?.user?.name || ""}
                      disabled={!isEditMode}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="mt-1.5 border-[#DDDDDD] bg-white text-black border-[0.5px] focus:ring-[#3B35C3] focus:border-[#3B35C3] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                        <Label htmlFor="occupation" className="text-zinc-600">
                          Occupation
                        </Label>
                    <Input
                          id="occupation"
                          defaultValue={userDetails?.user?.occupation || ""}
                          disabled={!isEditMode}
                          onChange={(e) =>
                            handleInputChange("occupation", e.target.value)
                          }
                          className="mt-1.5 border-[#DDDDDD] bg-white text-black border-[0.5px] focus:ring-[#3B35C3] focus:border-[#3B35C3] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                  </div>
                    </div>
                  </Card>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-800">
                    Contact Information
                  </h2>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl space-y-4">
                  <div>
                      <Label htmlFor="email" className="text-zinc-600">
                        Email
                      </Label>
                    <Input
                        id="email"
                        type="email"
                        defaultValue={userDetails?.user?.email || ""}
                      disabled={!isEditMode}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="mt-1.5 border-[#DDDDDD] bg-white text-black border-[0.5px] focus:ring-[#3B35C3] focus:border-[#3B35C3] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                      {/* <Label htmlFor="phone" className="text-zinc-600">
                        Phone Number
                      </Label> */}
                      {/* <Input
                        id="phone"
                        type="tel"
                        defaultValue={userDetails?.user?.phoneNumber || ""}
                        disabled={!isEditMode}
                        onChange={(e) =>
                          handleInputChange("phoneNumber", e.target.value)
                        }
                        className="mt-1.5 border-[#DDDDDD] bg-white text-black border-[0.5px] focus:ring-[#3B35C3] focus:border-[#3B35C3] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                      /> */}
                    </div>
                  </Card>
                </div>

                {/* Wallet Settings */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-800">
                    Wallet Settings
                  </h2>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl space-y-4">
                    <div>
                      <Label className="text-zinc-600">Connected Wallet</Label>
                      <div className="mt-1.5 flex items-center justify-between gap-4">
                        <div className="flex-1">
                    <Input
                            value={address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No wallet connected'}
                            disabled
                            className="border-[#DDDDDD] bg-gray-50 text-gray-500"
                    />
                  </div>
                        {address ? (
                          <Button
                            variant="outline"
                            onClick={() => handleDisconnectWallet()}
                            className="text-red-500 hover:text-red-600 border-red-500 hover:border-red-600"
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleConnectWallet()}
                            className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90"
                          >
                            Connect Wallet
                          </Button>
                        )}
                      </div>
                    </div>

                  <div>
                      <Label className="text-zinc-600">Primary Wallet</Label>
                      <div className="mt-1.5 flex items-center justify-between gap-4">
                    <Input
                          value={userDetails?.user?.walletAddress || 'No primary wallet set'}
                      disabled={!isEditMode}
                          onChange={(e) => handleInputChange("walletAddress", e.target.value)}
                          className="flex-1 border-[#DDDDDD] bg-white text-black disabled:bg-gray-50 disabled:text-gray-500"
                    />
                        {isEditMode && address && (
                          <Button
                            onClick={() => handleInputChange("walletAddress", address)}
                            className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90"
                          >
                            Use Connected Wallet
                          </Button>
                        )}
                  </div>
                      <p className="mt-2 text-sm text-zinc-500">
                        This wallet will be used as your primary wallet for transactions and verifications.
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Personal Details */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-800">
                    Personal Details
                  </h2>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl space-y-4">
                  <div>
                      <Label htmlFor="birthDay" className="text-zinc-600">
                        Birth Day
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="birthDay"
                            variant="outline"
                      disabled={!isEditMode}
                            className={`w-full justify-start text-left font-normal mt-1.5 border-[#DDDDDD] ${
                              !isEditMode 
                                ? "text-gray-500 bg-gray-50 cursor-not-allowed" 
                                : "bg-white text-zinc-800 hover:bg-zinc-50"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                            {formData.birthDay ? (
                              <span className="text-zinc-800">
                                {format(new Date(formData.birthDay), "MMMM d, yyyy")}
                              </span>
                            ) : userDetails?.user?.birthDay ? (
                              <span className="text-zinc-800">
                                {format(new Date(userDetails.user.birthDay), "MMMM d, yyyy")}
                              </span>
                            ) : (
                              <span className="text-zinc-500">Select your birth date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-[#DDDDDD]" align="start">
                          <div className="p-3 border-b border-[#DDDDDD]">
                            <h4 className="text-sm font-medium text-zinc-800">Birth Date</h4>
                            <p className="text-xs text-zinc-500">Select your date of birth from the calendar</p>
                          </div>
                          <DatePicker
                            mode="single"
                            selected={formData.birthDay ? new Date(formData.birthDay) : userDetails?.user?.birthDay ? new Date(userDetails.user.birthDay) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                handleInputChange("birthDay", date.toISOString());
                              }
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              return date > today;
                            }}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            classNames={{
                              months: "space-y-4",
                              month: "space-y-4",
                              caption: "flex justify-center pt-1 relative items-center",
                              caption_label: "text-sm font-medium text-zinc-800",
                              nav: "space-x-1 flex items-center",
                              nav_button: cn(
                                "h-7 w-7 bg-transparent p-0 hover:bg-zinc-100 rounded-md transition-colors",
                                "disabled:opacity-50 disabled:hover:bg-transparent"
                              ),
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                              table: "w-full border-collapse space-y-1",
                              head_row: "flex",
                              head_cell: "text-zinc-500 rounded-md w-9 font-normal text-[0.8rem]",
                              row: "flex w-full mt-2",
                              cell: cn(
                                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                                "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                              ),
                              day: cn(
                                "h-9 w-9 p-0 font-normal",
                                "hover:bg-zinc-100 rounded-md transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-[#3B35C3] focus:ring-offset-2"
                              ),
                              day_selected: "bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90",
                              day_today: "bg-zinc-100 text-zinc-900",
                              day_outside: "text-zinc-500 opacity-50",
                              day_disabled: "text-zinc-500 opacity-50",
                              day_range_middle: "aria-selected:bg-zinc-50 aria-selected:text-zinc-900",
                              day_hidden: "invisible",
                            }}
                    />
                        </PopoverContent>
                      </Popover>
                  </div>
                  <div>
                      <Label htmlFor="maritalStatus" className="text-zinc-600">
                        Marital Status
                      </Label>
                      <Select
                        defaultValue={
                          userDetails?.user?.maritalStatus || "single"
                        }
                        disabled={!isEditMode}
                        onValueChange={(value) =>
                          handleInputChange("maritalStatus", value)
                        }
                      >
                        <SelectTrigger className="mt-1.5 border-[#DDDDDD] bg-white text-black border-[0.5px] focus:ring-[#3B35C3] focus:border-[#3B35C3]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                  <div>
                      <Label htmlFor="location" className="text-zinc-600">
                        Location
                      </Label>
                    <Input
                        id="location"
                        defaultValue={userDetails?.user?.location || ""}
                      disabled={!isEditMode}
                        onChange={(e) =>
                          handleInputChange("location", e.target.value)
                        }
                        className="mt-1.5 border-[#DDDDDD] bg-white text-black border-[0.5px] focus:ring-[#3B35C3] focus:border-[#3B35C3] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                      <Label htmlFor="gender" className="text-zinc-600">
                        Gender
                      </Label>
                      <Select
                        defaultValue={userDetails?.user?.gender || ""}
                        disabled={!isEditMode}
                        onValueChange={(value) => handleInputChange("gender", value)}
                      >
                        <SelectTrigger className="mt-1.5 border-[#DDDDDD] bg-white text-black border-[0.5px] focus:ring-[#3B35C3] focus:border-[#3B35C3]">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non-binary">Non-binary</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="discordTag" className="text-zinc-600">
                        Discord Account
                      </Label>
                      <div className="mt-1.5 flex items-center justify-between gap-4">
                        <Input
                          id="discordTag"
                          value={userDetails?.user?.discordTag || "Not connected"}
                          disabled
                          className="flex-1 border-[#DDDDDD] bg-gray-50 text-gray-500"
                        />
                        <Button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/auth/discord');
                              const data = await response.json();
                              if (data.success) {
                                window.location.href = data.url;
                              } else {
                                console.error('Failed to get Discord auth URL:', data.error);
                              }
                            } catch (error) {
                              console.error('Error initiating Discord connection:', error);
                            }
                          }}
                          className="bg-[#5865F2] text-white hover:bg-[#4752C4]"
                        >
                          {userDetails?.user?.discordTag ? 'Reconnect Discord' : 'Connect Discord'}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-zinc-500">
                        Connect your Discord account to participate in the community.
                      </p>
                    </div>
                  </Card>
                </div>

                {/* About Me Section */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-800">
                    About Me
                  </h2>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl space-y-4">
                  <div>
                      <Label htmlFor="bio" className="text-zinc-600">
                        Bio
                      </Label>
                      <textarea
                        id="bio"
                        rows={4}
                        defaultValue={userDetails?.user?.bio || ""}
                      disabled={!isEditMode}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        className="w-full mt-1.5 p-3 border-[#DDDDDD] bg-white text-black border-[0.5px] rounded-md focus:ring-[#3B35C3] focus:border-[#3B35C3] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                  </div>
                  </Card>
                </div>

                {/* Interests Section */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-zinc-800">
                    Interests
                  </h2>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl space-y-4">
                  <div>
                      <Label htmlFor="interests" className="text-zinc-600">
                        Some Hobbies
                      </Label>
                      {isEditMode && (
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="new-interest"
                            value={newInterest}
                            onChange={(e) => setNewInterest(e.target.value)}
                            placeholder="Add new interest..."
                            className="border-[#DDDDDD] bg-white text-black"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddInterest();
                              }
                            }}
                          />
                          <Button
                            onClick={handleAddInterest}
                            disabled={!newInterest.trim()}
                            className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90"
                          >
                            Add
                          </Button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(userDetails?.user?.interests || []).map(
                          (interest: string) => (
                            <div
                              key={interest}
                              className={`px-3 py-1 bg-[#F0EFFF] text-[#3B35C3] rounded-full text-sm flex items-center gap-2 ${
                                isEditMode ? "pr-2" : ""
                              }`}
                            >
                              {interest}
                              {isEditMode && (
                                <button
                                  onClick={() => handleDeleteInterest(interest)}
                                  className="hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Family Milestones */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-zinc-800">
                    <h2 className="text-lg font-medium text-zinc-800">Updates Of Interest</h2>
                    </h2>
                    {isEditMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (isAddingMilestone) {
                            setIsAddingMilestone(false);
                            setNewMilestone({
                              date: null,
                              title: "",
                              description: "",
                            });
                          } else {
                            setIsAddingMilestone(true);
                          }
                        }}
                        className="text-[#3B35C3] border-[#3B35C3] bg-white hover:bg-[#F0EFFF] hover:text-[#3B35C3]"
                      >
                        {isAddingMilestone ? (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Milestone
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl space-y-4">
                    <div className="space-y-4">
                      {isAddingMilestone && (
                        <div className="border-b border-[#DDDDDD] pb-4 space-y-3">
                          <div>
                            <Label
                              htmlFor="milestone-date"
                              className="text-zinc-600"
                            >
                              Date
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal mt-1.5 border-[#DDDDDD] bg-white text-black"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {newMilestone.date
                                    ? format(newMilestone.date, "PPP")
                                    : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <DatePicker
                                  mode="single"
                                  selected={newMilestone.date || undefined}
                                  onSelect={(day) => {
                                    if (day) {
                                      setNewMilestone((prev) => ({
                                        ...prev,
                                        date: day,
                                      }));
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label
                              htmlFor="milestone-title"
                              className="text-zinc-600"
                            >
                              Title
                            </Label>
                            <Input
                              id="milestone-title"
                              value={newMilestone.title}
                              onChange={(e) =>
                                setNewMilestone((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              className="mt-1.5 border-[#DDDDDD] bg-white text-black"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="milestone-description"
                              className="text-zinc-600"
                            >
                              Description
                            </Label>
                            <textarea
                              id="milestone-description"
                              value={newMilestone.description}
                              onChange={(e) =>
                                setNewMilestone((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="w-full mt-1.5 p-3 border-[#DDDDDD] bg-white text-black border-[0.5px] rounded-md"
                              rows={2}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#3B35C3] border-[#3B35C3] bg-white hover:bg-[#F0EFFF] hover:text-[#3B35C3]"
                              onClick={() => {
                                setIsAddingMilestone(false);
                                setNewMilestone({
                                  date: null,
                                  title: "",
                                  description: "",
                                });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAddMilestone}
                              disabled={
                                !newMilestone.date || !newMilestone.title
                              }
                              className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90"
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      )}

                      {(userDetails?.user?.milestones || []).map(
                        (milestone: any) => (
                          <div
                            key={milestone._id}
                            className="flex items-start gap-4 group relative"
                          >
                            {editingMilestone === milestone._id ? (
                              <div className="flex-1 space-y-3">
                                <div>
                                  <Label
                                    htmlFor={`edit-date-${milestone._id}`}
                                    className="text-zinc-600"
                                  >
                                    Date
                                  </Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal mt-1.5 border-[#DDDDDD] bg-white text-black"
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {editedMilestone?.date
                                          ? format(
                                              new Date(editedMilestone.date),
                                              "PPP"
                                            )
                                          : "Pick a date"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
                                      <DatePicker
                                        mode="single"
                                        selected={
                                          editedMilestone?.date
                                            ? new Date(editedMilestone.date)
                                            : undefined
                                        }
                                        onSelect={(day) => {
                                          if (day) {
                                            handleMilestoneEdit(
                                              "date",
                                              format(day, "yyyy/MM/dd")
                                            );
                                          }
                                        }}
                                        initialFocus
                    />
                                    </PopoverContent>
                                  </Popover>
                  </div>
                  <div>
                                  <Label
                                    htmlFor={`edit-title-${milestone._id}`}
                                    className="text-zinc-600"
                                  >
                                    Title
                                  </Label>
                    <Input
                                    id={`edit-title-${milestone._id}`}
                                    value={editedMilestone?.title || ""}
                                    onChange={(e) =>
                                      handleMilestoneEdit(
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    className="mt-1.5 border-[#DDDDDD] bg-white text-black"
                                  />
                                </div>
                                <div>
                                  <Label
                                    htmlFor={`edit-description-${milestone._id}`}
                                    className="text-zinc-600"
                                  >
                                    Description
                                  </Label>
                                  <textarea
                                    id={`edit-description-${milestone._id}`}
                                    value={editedMilestone?.description || ""}
                                    onChange={(e) =>
                                      handleMilestoneEdit(
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    className="w-full mt-1.5 p-3 border-[#DDDDDD] bg-white text-black border-[0.5px] rounded-md"
                                    rows={2}
                    />
                  </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingMilestone(null);
                                      setEditedMilestone(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (editedMilestone) {
                                        handleUpdateMilestone(
                                          milestone._id,
                                          editedMilestone
                                        );
                                      }
                                      setEditingMilestone(null);
                                      setEditedMilestone(null);
                                    }}
                                    className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90"
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-sm font-medium text-[#3B35C3] min-w-[60px]">
                                  {new Date(milestone.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "2-digit",
                                      day: "2-digit",
                                      year: "numeric",
                                    }
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-zinc-800">
                                    {milestone.title}
                                  </h4>
                                  <p className="text-sm text-zinc-500">
                                    {milestone.description}
                                  </p>
                                </div>
                                {isEditMode && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingMilestone(milestone._id);
                                        setEditedMilestone(milestone);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <FileText className="h-4 w-4 text-zinc-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteMilestone(milestone._id)
                                      }
                                      className="h-8 w-8 p-0 hover:text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )
                      )}

                      {userDetails?.user?.milestones?.length === 0 && (
                        <div className="text-center py-8 text-zinc-500">
                          No milestones added yet
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Family Role & Contributions */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-black">
                    Street Contributions
                  </h2>
                  <Card className="p-6 border border-[#DDDDDD] border-[0.5px] bg-white shadow-none rounded-xl space-y-4">
                  <div>
                      <Label htmlFor="familyRole" className="text-zinc-600">
                        Street Contributions
                      </Label>
                      <div className="relative">
                        <div className="flex items-center mt-1.5 text-black b-rounded-lg border border-[#DDDDDD] bg-white px-3">
                          <Search className="h-4 w-4 shrink-0 opacity-50 text-black" />
                          <input
                            placeholder={
                              userDetails?.user?.familyRole ||
                              "Search role or type custom role..."
                            }
                            value={searchValue}
                      disabled={!isEditMode}
                            onChange={(e) => {
                              setSearchValue(e.target.value);
                              setIsSearching(true);
                              handleInputChange("familyRole", e.target.value);
                            }}
                            onFocus={() => isEditMode && setIsSearching(true)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && searchValue) {
                                handleCustomRoleSubmit(searchValue);
                                setIsSearching(false);
                              }
                              if (e.key === "Escape") {
                                setIsSearching(false);
                              }
                            }}
                            className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0 pl-2 disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>

                        {isSearching && (
                          <div className="absolute w-full z-50 mt-1 bg-white border border-[#DDDDDD] rounded-lg shadow-lg">
                            <Command className="rounded-lg">
                              <CommandList>
                                <CommandEmpty>
                                  Press enter to set "{searchValue}" as your
                                  custom role
                                </CommandEmpty>
                                <CommandGroup
                                  heading="Predefined Roles"
                                  className="text-zinc-600 bg-white"
                                >
                                  <CommandItem
                                    value="historian"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "historian"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Family Historian
                                  </CommandItem>
                                  <CommandItem
                                    value="organizer"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "organizer"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Event Organizer
                                  </CommandItem>
                                  <CommandItem
                                    value="storyteller"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "storyteller"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Storyteller
                                  </CommandItem>
                                  <CommandItem
                                    value="photographer"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "photographer"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Family Photographer
                                  </CommandItem>
                                  <CommandItem
                                    value="genealogist"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "genealogist"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Family Genealogist
                                  </CommandItem>
                                  <CommandItem
                                    value="keeper"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "keeper"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Family Keeper
                                  </CommandItem>
                                  <CommandItem
                                    value="coordinator"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "coordinator"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Family Coordinator
                                  </CommandItem>
                                  <CommandItem
                                    value="archivist"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "archivist"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Family Archivist
                                  </CommandItem>
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup
                                  heading="Common Custom Roles"
                                  className="text-zinc-600 bg-white"
                                >
                                  <CommandItem
                                    value="grandparent"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "grandparent"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Grandparent
                                  </CommandItem>
                                  <CommandItem
                                    value="parent"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "parent"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Parent
                                  </CommandItem>
                                  <CommandItem
                                    value="sibling"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "sibling"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Sibling
                                  </CommandItem>
                                  <CommandItem
                                    value="cousin"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "cousin"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Cousin
                                  </CommandItem>
                                  <CommandItem
                                    value="aunt-uncle"
                                    onSelect={(value) => {
                                      handleRoleSelect(value);
                                      setIsSearching(false);
                                    }}
                                    className={
                                      selectedRole === "aunt-uncle"
                                        ? "bg-[#F0EFFF] text-[#3B35C3]"
                                        : "text-zinc-800"
                                    }
                                  >
                                    Aunt/Uncle
                                  </CommandItem>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-zinc-500">
                          {customRole
                            ? `Custom role: ${customRole}`
                            : `Selected role: ${
                                selectedRole.charAt(0).toUpperCase() +
                                selectedRole.slice(1)
                              }`}
                        </p>
                        {(customRole || selectedRole) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRole("historian");
                              setCustomRole("");
                              setSearchValue("");
                              setIsSearching(false);
                            }}
                            className="text-sm text-zinc-500 hover:text-zinc-800"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="contributions" className="text-zinc-600">
                        Recent Contributions
                      </Label>
                      <div className="mt-2 space-y-2">
                        {(userDetails?.user?.contributions || []).map(
                          (contribution: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm text-zinc-600"
                            >
                              {index === 0 && (
                                <FileImage
                                  size={16}
                                  className="text-[#3B35C3]"
                                />
                              )}
                              {index === 1 && (
                                <FileText
                                  size={16}
                                  className="text-[#3B35C3]"
                                />
                              )}
                              {index === 2 && (
                                <Calendar
                                  size={16}
                                  className="text-[#3B35C3]"
                    />
                              )}
                              <span>{contribution}</span>
                  </div>
                          )
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="hidden md:flex bg-zinc-100 border-l border-r border-zinc-200" />
        
        <ResizablePanel defaultSize={20} minSize={25} maxSize={30} className="hidden md:block">
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
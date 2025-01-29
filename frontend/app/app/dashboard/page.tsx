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
import { UserDetails } from "@/types/user";
import { useUserDetails } from "@/hooks/useUserDetails";
import { useUserImages } from "@/hooks/useUserImages";
import { RightDashboard } from "@/components/RightDashboard";
import { useSession } from "next-auth/react";
interface TransactionDetails {
  id: string;
  status: string;
  timestamp: string;
  size: number;
  type: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<{
    [key: string]: TransactionDetails;
  }>({});

  const { uploadFile, uploadProgress, isUploading, error } = useArweaveUpload({
    userId: "user123",
    familyId: "family456",
  });

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const {
    images,
    isLoading: imagesLoading,
    error: imagesError,
    refreshImages,
    deleteImage,
    canUploadMore,
  } = useUserImages(userDetails?.user?.id || "");


  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const email = session?.user?.email;
      if (!email) {
        console.error('No email found in session');
        return;
      }

      // First try to get the current user
      const response = await fetch('/api/users/current?email=' + encodeURIComponent(email));
      const data = await response.json();

      if (data.success) {
        setUserDetails(data);
      } else {
        // If current user endpoint fails, fallback to email endpoint
        const fallbackResponse = await fetch(
          `/api/users/email/${encodeURIComponent(email)}`
        );
        const fallbackData = await fallbackResponse.json();

        if (fallbackData.success) {
          console.log("User details (fallback):", fallbackData);
          setUserDetails(fallbackData);
        } else {
          console.error("Failed to fetch user:", fallbackData.error);
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
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUserDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserDetails();
    }
  }, [session]); // Only depend on session changes


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

  const router = useRouter();
  const pathname = usePathname();
  const currentMember = pathname.split("/").pop() || "me";

  const handleNodeClick = (nodeId: string) => {
    router.push(`/app/familyTree/${nodeId}`);
  };

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  return (
    <div className="flex h-screen bg-white">
      <DashboardSidebar
        activePage="dashboard"
        onNavigate={handleNavigation}
        userName={userDetails?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userDetails?.user?.profileImage || ""}
        rewardPoints={10}
      />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={80} minSize={30} className="flex-1">
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-4 border-zinc-200">
              {/* <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="  absolute left-2 top-2.5 h-4 w-4 text-zinc-300" />
                  <Input
                    placeholder="Search your legacy"
                    className="pl-8 bg-white border-zinc-100 focus:ring-zinc-200 focus:border-zinc-200 text-zinc-500 placeholder:text-zinc-300"
                  />
                </div>
              </div> */}

              <div className="flex gap-4">
                {/* <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="bg-white border-zinc-200 rounded-xl px-4 py-2 text-sm font-normal text-zinc-800 "
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Type
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Documents</DropdownMenuItem>
                    <DropdownMenuItem>Photos</DropdownMenuItem>
                    <DropdownMenuItem>Videos</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> */}

                {/* <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="bg-white border-zinc-200 rounded-xl px-4 py-2 text-sm font-normal text-zinc-800 "
                    >
                      <Users className="mr-2 h-4 w-4" />
                      People
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Family</DropdownMenuItem>
                    <DropdownMenuItem>Friends</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> */}

                {/* <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="bg-white border-zinc-200 rounded-xl px-4 py-2 text-sm font-normal text-zinc-800"
                    >
                      <Folder className="mr-2 h-4 w-4" />
                      Date
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                    <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                    <DropdownMenuItem>Last year</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> */}
              </div>
            </div>

            <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
              <h2 className="text-xl font-semibold mb-2 text-zinc-800">
               Your Street Network Timline From Discord Will Go Here
              </h2>
              <div className="mb-4">
                <img
                  src="/dashboard/Network.png"
                  alt="Women In Bitcoin"
                  className="w-64 h-auto"
                />
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  {/* <Button
                    size="sm"
                    className="gap-2 bg-[#F0EFFF] text-[#3B35C3] hover:bg-[#E6E5FF] hover:text-[#3B35C3]"
                  >
                    <Plus size={16} />
                    Add
                  </Button> */}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add to Your Legacy</DialogTitle>
                    <DialogDescription>
                      Upload files to preserve your family's memories. These
                      files will be immutable and private to your family.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Upload Type</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 justify-start gap-2"
                        >
                          <FileImage size={16} />
                          Image
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start gap-2"
                        >
                          <FileVideo size={16} />
                          Video
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start gap-2"
                        >
                          <FileText size={16} />
                          Text
                        </Button>
                      </div>
                    </div>

                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors
                        ${
                          dragActive
                            ? "border-[#3B35C3] bg-[#F0EFFF]"
                            : "border-zinc-200"
                        }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        multiple
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setSelectedFiles(Array.from(e.target.files));
                          }
                        }}
                      />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <Upload
                          className={`w-8 h-8 mx-auto mb-2 ${
                            dragActive ? "text-[#3B35C3]" : "text-zinc-400"
                          }`}
                        />
                        <p
                          className={`text-sm ${
                            dragActive ? "text-[#3B35C3]" : "text-zinc-600"
                          }`}
                        >
                          {dragActive
                            ? "Drop files here"
                            : "Drag and drop files here, or click to select"}
                        </p>
                      </Label>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-zinc-800">
                          Selected files:
                        </div>
                        <ScrollArea className="h-[150px] w-full rounded-md border border-zinc-200 p-2">
                          <div className="space-y-2">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-zinc-50 p-2 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  {file.type.startsWith("image/") ? (
                                    <FileImage
                                      size={16}
                                      className="text-zinc-500"
                                    />
                                  ) : file.type.startsWith("video/") ? (
                                    <FileVideo
                                      size={16}
                                      className="text-zinc-500"
                                    />
                                  ) : (
                                    <FileText
                                      size={16}
                                      className="text-zinc-500"
                                    />
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-sm text-zinc-600 truncate max-w-[200px]">
                                      {file.name}
                                    </span>
                                    <span className="text-xs text-zinc-400">
                                      {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                  </div>
                                  {uploadStatus[file.name] && (
                                    <div className="flex flex-col ml-2">
                                      <span
                                        className={`text-xs ${
                                          uploadStatus[file.name] === "success"
                                            ? "text-green-500"
                                            : uploadStatus[file.name] ===
                                              "error"
                                            ? "text-red-500"
                                            : "text-blue-500"
                                        }`}
                                      >
                                        {uploadStatus[file.name]}
                                      </span>
                                      {transactions[file.name] && (
                                        <span className="text-xs text-zinc-400">
                                          TX:{" "}
                                          {transactions[file.name].id.slice(
                                            0,
                                            8
                                          )}
                                          ...
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-700"
                                  onClick={() =>
                                    setSelectedFiles((files) =>
                                      files.filter((_, i) => i !== index)
                                    )
                                  }
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex flex-col gap-2">
                    <p className="text-xs text-zinc-500 text-left">
                      By uploading, you acknowledge that these files will be
                      permanently stored and accessible only to your family
                      members.
                    </p>
                    <div className="flex justify-end gap-2">
                      <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogTrigger>
                      <Button
                        className="bg-[#3B35C3] text-white hover:bg-[#2D2A9C]"
                        onClick={handleUploadToArweave}
                        disabled={isUploading || selectedFiles.length === 0}
                      >
                        {isUploading ? "Uploading..." : "Upload to Legacy"}
                      </Button>
                    </div>
                    {error && (
                      <p className="text-xs text-red-500 mt-2">{error}</p>
                    )}
                    {uploadProgress && (
                      <div className="w-full bg-zinc-100 rounded-full h-2 mt-2">
                        <div
                          className="bg-[#3B35C3] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.progress}%` }}
                        />
                      </div>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Beta Feature Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-2 mt-4 bg-[#FFE4E4] text-[#C33535] hover:bg-[#FFD5D5] hover:text-[#C33535]"
                  >
                    Coming Soon
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Feature Coming Soon!</DialogTitle>
                    <DialogDescription>
                      This feature will be released soon in beta. For now, we encourage you to invite as many family members as possible to start building your family tree. The more members you have, the richer your family legacy will be!
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <DialogTrigger asChild>
                      <Button variant="outline">Close</Button>
                    </DialogTrigger>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              
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

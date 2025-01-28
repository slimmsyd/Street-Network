// Create a new file for user-related types
export interface Milestone {
  _id: string;
  date: string;
  title: string;
  description: string;
}

export interface UserDetails {
  user: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    profileImageId?: string;
    occupation?: string;
    phoneNumber?: string;
    birthDay?: string;
    location?: string;
    bio?: string;
    familyRole?: string;
    maritalStatus?: string;
    gender?: string;
    interests?: string[];
    milestones?: Milestone[];
    contributions?: string[];
  };
  exists: boolean;
} 


export interface DashboardSidebarProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
  userName?: string;
  userAvatar?: string;
  rewardPoints?: number;
}

export interface RightDashboardProps {
  userName: string;
  userAvatar: string;
  userRole: string;
  familyMemberCount: number;
  onInvite: () => void;
  onSendMessage: (message: string) => void;
}

export interface FamilyTreeProps {
  currentPage: string;
  onNodeClick: (nodeId: string) => void;
  className?: string;
  userProfileImage?: string;
}

export interface WorkspaceMember {
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  role: string;
  joinedAt: string;
  familyConnections?: Array<{
    relatedUserId: string;
    relationship: string;
    confirmed: boolean;
  }>;
}
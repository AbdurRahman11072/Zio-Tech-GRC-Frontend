"use client";

import {
  LayoutDashboard,
  FileText,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Building2,
  Database,
  FolderOpen,
  Bell,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar";

const platformItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Notifications",
    icon: Bell,
  },
];

const auditItems = [
  {
    title: "Audit Projects",
    icon: FolderOpen,
  },
  {
    title: "Guidelines",
    icon: ClipboardList,
  },
  {
    title: "TOR Management",
    icon: FileText,
  },
  {
    title: "DRT Tracker",
    icon: CheckCircle2,
  },
];

const managementItems = [
  {
    title: "Companies",
    icon: Building2,
  },
  {
    title: "Guideline Categories",
    icon: ShieldCheck,
  },
  {
    title: "User Management",
    icon: Users,
  },
  {
    title: "Compliance",
    icon: Database,
  },
];

interface AppSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export function AppSidebar({
  activeTab = "Dashboard",
  onSelectTab,
}: AppSidebarProps) {
  const { user, logout } = useAuth();
  const role = user?.role || "company_user";

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-400 border border-red-500/20",
    auditor: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    auditee: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    company_user: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  };

  // 1. Platform Items (Universal)
  const platformItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Notifications",
      icon: Bell,
    },
  ];

  // 2. Audit & Operations Section (Tailored by Role)
  let auditGroupLabel = "Audit Engagements";
  let auditItems: { title: string; icon: any; displayLabel?: string }[] = [];

  if (role === "admin") {
    auditGroupLabel = "Audit Administration";
    auditItems = [
      { title: "Audit Projects", icon: FolderOpen, displayLabel: "All Audit Projects" },
      { title: "TOR Management", icon: FileText, displayLabel: "TOR Master Scopes" },
      { title: "DRT Tracker", icon: CheckCircle2, displayLabel: "Global DRT Tracker" },
    ];
  } else if (role === "auditor") {
    auditGroupLabel = "Auditor Operations";
    auditItems = [
      { title: "Audit Projects", icon: FolderOpen, displayLabel: "Audit Engagements" },
      { title: "TOR Management", icon: FileText, displayLabel: "TOR Authoring" },
      { title: "DRT Tracker", icon: CheckCircle2, displayLabel: "Task Division & DRT" },
    ];
  } else if (role === "auditee") {
    auditGroupLabel = "Verification Queue";
    auditItems = [
      { title: "DRT Tracker", icon: CheckCircle2, displayLabel: "My Verification Tasks" },
      { title: "Audit Projects", icon: FolderOpen, displayLabel: "Assigned Audits" },
    ];
  } else {
    // company_user (Client Organization)
    auditGroupLabel = "Compliance Operations";
    auditItems = [
      { title: "Audit Projects", icon: FolderOpen, displayLabel: "My Audits" },
      { title: "DRT Tracker", icon: CheckCircle2, displayLabel: "Evidence Vault (DRT)" },
      { title: "TOR Management", icon: FileText, displayLabel: "Terms of Reference" },
    ];
  }

  // 3. Management Section (Tailored by Role)
  let managementGroupLabel = "";
  let managementItems: { title: string; icon: any; displayLabel?: string }[] = [];

  if (role === "admin") {
    managementGroupLabel = "System Administration";
    managementItems = [
      { title: "Companies", icon: Building2, displayLabel: "Tenant Companies" },
      { title: "Guideline Categories", icon: ShieldCheck, displayLabel: "Guideline Categories" },
    ];
  } else if (role === "company_user") {
    managementGroupLabel = "Organization";
    managementItems = [
      { title: "My Organization", icon: Building2, displayLabel: "Organization & Plan" },
    ];
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => onSelectTab?.("Dashboard")}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                Z
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold">Zio Tech GRC</span>
                <span className="truncate text-xs text-muted-foreground">
                  Audit & Compliance
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Platform Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={activeTab === item.title}
                    onClick={() => onSelectTab?.(item.title)}
                    className="cursor-pointer"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Audit Modules Section */}
        <SidebarGroup>
          <SidebarGroupLabel>{auditGroupLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {auditItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.displayLabel || item.title}
                    isActive={activeTab === item.title}
                    onClick={() => onSelectTab?.(item.title)}
                    className="cursor-pointer"
                  >
                    <item.icon />
                    <span>{item.displayLabel || item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Section (Only if items exist for this role) */}
        {managementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{managementGroupLabel}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.displayLabel || item.title}
                      isActive={activeTab === item.title}
                      onClick={() => onSelectTab?.(item.title)}
                      className="cursor-pointer"
                    >
                      <item.icon />
                      <span>{item.displayLabel || item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Extras Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Help & Support">
                  <HelpCircle />
                  <span>Help & Support</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={user?.name ?? "User"}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white font-semibold text-xs uppercase">
                {user?.name?.charAt(0) ?? "U"}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {user && (
            <SidebarMenuItem>
              <span
                className={`mx-2 mb-1 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  roleColors[user.role] ?? "bg-white/10 text-muted-foreground"
                }`}
              >
                <ShieldCheck className="h-3 w-3" />
                {user.role.replace("_", " ")}
              </span>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={logout}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

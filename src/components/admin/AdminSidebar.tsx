
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  MapPin,
  Users,
  Edit,
  FileText,
  Brain,
  Share2,
  ShieldAlert,
  Activity,
  Search,
  MessageSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  {
    group: "Main",
    items: [
      { id: "overview", label: "Overview", icon: BarChart3 },
      { id: "cities", label: "Cities", icon: MapPin },
      { id: "users", label: "Users", icon: Users },
      { id: "content", label: "Content", icon: Edit },
      { id: "support", label: "Support Hub", icon: MessageSquare },
    ],
  },
  {
    group: "Publishing",
    items: [
      { id: "blog", label: "Blog", icon: FileText },
      { id: "social", label: "Social Media", icon: Share2 },
    ],
  },
  {
    group: "Tools",
    items: [
      { id: "ai", label: "AI Settings", icon: Brain },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "operations", label: "Operations Center", icon: Activity },
      { id: "seo", label: "SEO Management", icon: Search, isLink: true, path: "/admin/seo" },
    ],
  },
  {
    group: "Security",
    items: [
      { id: "moderation", label: "Listing Moderation", icon: ShieldAlert },
      { id: "smart-moderation", label: "Smart Moderation", icon: Brain },
      { id: "reviews", label: "Review Moderation", icon: ShieldAlert },
      { id: "claims", label: "Protection Claims", icon: ShieldAlert },
      { id: "disputes", label: "Dispute Management", icon: ShieldAlert },
      { id: "fraud", label: "Fraud Detection", icon: ShieldAlert },
      { id: "performance", label: "Performance", icon: Activity },
    ],
  },
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {navigationItems.map((section) => (
          <SidebarGroup key={section.group}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-semibold">
                {section.group}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => {
                          if (item.isLink && item.path) {
                            navigate(item.path);
                          } else {
                            onTabChange(item.id);
                          }
                        }}
                        isActive={isActive}
                        tooltip={isCollapsed ? item.label : undefined}
                      >
                        <Icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

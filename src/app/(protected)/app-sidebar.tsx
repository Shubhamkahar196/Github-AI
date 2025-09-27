"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Bot, CreditCard, LayoutDashboard, Plus, Presentation } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import Image from "next/image";


 const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },

    {
      title: "Q&A",
      url: "/qa",
      icon: Bot,
    },
    {
      title: "Meeting",
      url: "/meeting",
      icon: Presentation,
    },
    {
      title: "Billing",
      url: "/billing",
      icon: CreditCard,
    },
  ];


  const projects = [
    {
      name: "Project 1"
    },
    {
      name: "Project 2"
    },
    {
      name: "Project 3"
    },
  ]

export function AppSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    // changes variant = floating to sidebar
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        {/*logo  */}
        <div className="flex items-center gap-2">
          <Image src="/logo-1.png" alt="logo" width={40} height={40} className="rounded-full " />
          {open && <h1 className="text-xl font-bold text-primary/80">GitHub AI</h1>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* main sidegroup */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={cn(
                        {
                          "!bg-primary !text-white": pathname === item.url,
                        },
                        "list-none"
                      )}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* projects */}
        <SidebarGroup>
          <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((project) => (
                <SidebarMenuItem key={project.name}>
                  <SidebarMenuButton asChild>
                    <Link href={`/project`}>
                      <div className="rounded-sm border size-6 flex items-center justify-center text-sm bg-primary text-white">
                        {project.name[0]}
                      </div>
                      <span>{project.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <div className="h-2"></div>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/create">
                    <Button size="sm" variant="outline" className="w-fit">
                      <Plus />
                      Create Project
                    </Button>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

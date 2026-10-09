"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import {
  AudioLinesIcon,
  BookmarkIcon,
  Link2Icon,
  ListMusicIcon,
  MicIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { href: "/record", label: "Record", icon: MicIcon },
  { href: "/meetings", label: "Meetings", icon: ListMusicIcon },
  { href: "/saved-moments", label: "Saved moments", icon: BookmarkIcon },
  { href: "/shared-clips", label: "Shared clips", icon: Link2Icon },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider style={{ "--sidebar-width": "14rem" } as CSSProperties}>
      <Sidebar collapsible="offcanvas" className="border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <Link href="/meetings" className="flex items-center gap-2.5 font-semibold tracking-[-0.03em]">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <AudioLinesIcon aria-hidden="true" />
            </span>
            <span className="text-base">accord</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="py-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <AppNavigation />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <p className="text-xs text-muted-foreground">Google Meet · Chrome</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-background">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:hidden">
          <SidebarTrigger />
          <span className="font-semibold tracking-[-0.03em]">accord</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppNavigation() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href === "/meetings" && pathname.startsWith("/meetings/"));

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              render={<Link href={item.href} aria-current={isActive ? "page" : undefined} />}
              isActive={isActive}
              tooltip={item.label}
              onClick={() => { if (isMobile) setOpenMobile(false); }}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

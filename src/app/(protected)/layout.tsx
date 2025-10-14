

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import React from "react";
import { AppSidebar } from "./app-sidebar";

interface Props {
  children: React.ReactNode;
}

const SidebarLayout = ({ children }: Props) => {
  return (
    <SidebarProvider>
        {/* appside bar */}

        <AppSidebar/>

        <main className="w-full m-2 md:m-4">

          <div className="flex items-center justify-center gap-2 border-sidebar-border bg-sidebar border shadow rounded-md p-2 px-4 ">
               {/* search bar */}
               <SidebarTrigger className="md:hidden" />

               <div className="ml-auto"></div>
               <UserButton/>
          </div>

          <div className="h-4"></div>
          {/* maincontent */}

             <div className="border-sidebar-border bg-sidebar border shadow rounded-md overflow-y-scroll h-[calc(100vh-6rem)] p-4 md:p-6">
                 {children}
             </div>

        </main>
    </SidebarProvider>
  );
};

export default SidebarLayout;

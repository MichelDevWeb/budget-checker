import MobileSideBar from "@/components/MobileSideBar";
import React, { ReactNode } from "react";

function layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-screen w-full flex-col">
      <MobileSideBar />
      <div className="w-full">{children}</div>
    </div>
  );
}

export default layout;

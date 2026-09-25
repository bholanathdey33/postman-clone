import { currentUser } from "@/modules/authentication/actions";
import UserButton from "@/modules/authentication/components/user-button";
import Header from "@/modules/layout/components/header";
import { initializeWorkspace } from "@/modules/workspace/actions";
import React from "react";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const workspace = await initializeWorkspace();
  const user = await currentUser();

  console.log("WORKSPACE:", workspace);
  return (
    <>
      <Header user={user} />

      <main className="h-[calc(100vh-4rem)] w-full min-h-0 min-w-0 flex-1">
        <div className="flex h-full w-full min-h-0 min-w-0">
          <div className="h-full min-h-0 min-w-0 flex-1 bg-zinc-900">
            {children}
          </div>
        </div>
      </main>
    </>
  );
};

export default RootLayout;

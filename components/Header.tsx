'use client';

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Breadcrumbs from "./Breadcrumbs";
import Link from "next/link";
import { PlusIcon, Settings } from "lucide-react";
import FundUs from "./FundUs";
import ContactUs from "./ContactUs";
import NewOrgButton from "./NewOrgButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import JoinOrgButton from "./JoinOrgButton";
import { SidebarTrigger } from "./ui/sidebar";
import { useState } from "react";
import { Button } from "./ui/button";
import Image from "next/image";

function Header() {

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isNewOrgOpen, setIsNewOrgOpen] = useState(false);
  const [isJoinOrgOpen, setIsJoinOrgOpen] = useState(false);

  return (
    <header className="top-0 left-0 right-0 z-10 shadow-md bg-[#6F61EF]">
      <div className="flex items-center justify-between m-1 mx-4">
        <SignedIn>
          <div className="flex items-center text-white text-2xl pr-2 -mx-2">
            <SidebarTrigger className="text-white text-4xl" />
          </div>
        </SignedIn>
        <div className="flex items-center justify-between flex-1">
          <h1 className="text-2xl font-bold text-white">
            <Link href="/">
              <Image src="/logoFull.svg" alt="Logo" width={150} height={50} />
            </Link>
          </h1>

          {/* Breadcrumbs */}
          <SignedIn>
            <Breadcrumbs />
          </SignedIn>

          <div className="flex gap-6 items-center text-white">
            <SignedIn>
              {/* Note: The buttons in these components are extracted out to put here due to the interference of DropdownMenu with Dialogs */}
              <NewOrgButton isOpen={isNewOrgOpen} setIsOpen={setIsNewOrgOpen} />
              <JoinOrgButton isOpen={isJoinOrgOpen} setIsOpen={setIsJoinOrgOpen} />
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger className="hover:translate-y-[-2px] transition-transform duration-300">
                  <PlusIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Button className="bg-[#6F61EF] w-full hover:bg-[#5646e4]" onClick={() => { setIsNewOrgOpen(true); setDropdownOpen(false); }}>
                      Create Org
                    </Button>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Button className="bg-[#6F61EF] w-full hover:bg-[#5646e4]" onClick={() => { setIsJoinOrgOpen(true); setDropdownOpen(false); }}>
                      Join Org
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SignedIn>
            <FundUs />
            <ContactUs />
            <SignedOut>
              <SignInButton />
            </SignedOut>

            <SignedIn>
              <Link href={'/setting'}>
                <p className="truncate">
                  <Settings className="text-white hover:translate-y-[-2px] transition-transform duration-300" />
                </p>
              </Link>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
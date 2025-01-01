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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import JoinOrgButton from "./JoinOrgButton";

function Header() {

  return (
    <header className="top-0 left-0 right-0 z-10 shadow-md bg-[#6F61EF]	">
      <div className="flex items-center justify-between m-3 mx-4">
        <h1 className="text-2xl font-bold text-white">
          <Link href="/">
            <img src="/logoFull.svg" alt="Logo" />
          </Link>
        </h1>

        {/* Breadcrumbs*/}
        <SignedIn>
          <Breadcrumbs />
        </SignedIn>

        <div className="flex gap-6 items-center text-white">
          <SignedIn>
            <DropdownMenu>
              <DropdownMenuTrigger className="hover:translate-y-[-2px] transition-transform duration-300"><PlusIcon /></DropdownMenuTrigger>
              <DropdownMenuContent>
                {/* <DropdownMenuItem><NewOrgButton/></DropdownMenuItem>
                <DropdownMenuItem><JoinOrgButton/></DropdownMenuItem> */}
                <div className="space-y-2 flex flex-col m-1 my-2">
                  <NewOrgButton />
                  <JoinOrgButton />
                </div>
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
              <p className="truncate"><Settings className="text-white hover:translate-y-[-2px] transition-transform duration-300" /></p>
            </Link>
            <UserButton /> {/* Should not use UserButton, but rather use UserProfile from Clerk (IMPLEMENT IT INTO SETTINGS) */}
          </SignedIn>
        </div>
      </div>
    </header>
  )
}

export default Header
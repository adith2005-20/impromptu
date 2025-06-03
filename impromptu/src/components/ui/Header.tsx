import React from "react";
import { SignedIn, SignedOut } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

const Header = () => {
  return (
    <header
      id="header"
      className="bg-foreground sticky top-0 z-50 flex h-18 w-full px-8 py-4"
    >
      <div className="flex w-full items-center justify-between">
        <Link href="/">
          <Image src='/impromptu-lg.svg' alt='Impromptu logo' width={150} height={100}/>
        </Link>
        <div className="flex gap-2">
          <SignedIn>
            <Link href="/auth/sign-out">
              <Button variant={"secondary"}>Log out</Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/auth/sign-in">
              <Button>Log in</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant={"outline"}>Sign Up</Button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;

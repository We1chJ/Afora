import SignedInLanding from "@/components/SignedInLanding";
import { SignedIn, SignedOut, SignInButton, } from "@clerk/nextjs";

export default function Home() {

  return (
    <main className="flex h-full">
      <SignedInLanding />
    </main>
  );
}
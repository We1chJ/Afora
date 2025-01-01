import SignedInLanding from "@/components/SignedInLanding";
import { SignedIn, SignedOut, SignInButton, } from "@clerk/nextjs";

export default function Home() {

  return (
    <main className="flex h-full">
      <SignedIn>
        <SignedInLanding />
      </SignedIn>
      <SignedOut>
        <div className="w-full h-full bg-gradient-to-r from-[#6F61EF] via-[#6F61EF] to-purple-500/0 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Welcome to Afora
            </h2>
            <p className="text-xl text-gray-600 mb-8 text-center">
              Create an account to start using Afora!
            </p>
            <div className="flex justify-center">
              <SignInButton mode="modal">
                <button className="bg-[#6F61EF] hover:bg-[#5948ee] text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
                  Sign Up / Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </SignedOut>
    </main>
  );
}
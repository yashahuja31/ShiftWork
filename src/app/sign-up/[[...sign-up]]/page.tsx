import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ink px-6">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#7c3aed",
            colorForeground: "#ffffff",
            colorMutedForeground: "#94a3b8",
          },
        }}
      />
    </main>
  );
}

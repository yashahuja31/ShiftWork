import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ink px-6">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#3ECF8E',
            colorBackground: '#121A2B',
            colorForeground: '#E8ECF1',
            colorMutedForeground: '#7C8AA5',
            borderRadius: '0.75rem',
          },
        }}
      />
    </main>
  );
}

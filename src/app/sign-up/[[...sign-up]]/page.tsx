import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ink px-6">
      <SignUp
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

import { PasswordStrengthForm } from './PasswordStrengthForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldQuestion } from 'lucide-react';

export default function PasswordStrengthPage() {
  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldQuestion className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Password Strength Analyzer</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Enter a password to get AI-powered suggestions for making it stronger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordStrengthForm />
        </CardContent>
      </Card>
    </div>
  );
}

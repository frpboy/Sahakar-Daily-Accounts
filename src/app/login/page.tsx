import {
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to Sahakar Daily Accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginLink>
            <Button className="w-full" size="lg">
              Sign In
            </Button>
          </LoginLink>
          <RegisterLink>
            <Button className="w-full" variant="outline" size="lg">
              Create Account
            </Button>
          </RegisterLink>
          <p className="text-center text-sm text-gray-500 mt-4">
            Secure authentication powered by Kinde
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

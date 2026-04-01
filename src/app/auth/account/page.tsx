'use client'

import { auth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function AccountPage() {
  const router = useRouter()
  const { data: sessionData, isPending } = auth.useSession()
  const user = sessionData?.user

  useEffect(() => {
    if (!isPending && !user) {
      router.push('/auth/sign-in')
    }
  }, [isPending, user, router])

  if (isPending) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-vh-100">
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </Container>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Email</h3>
              <p className="text-base text-gray-900">{user.email}</p>
            </div>

            {user.emailVerified && (
              <div className="px-4 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                ✓ Email verified
              </div>
            )}

            <div className="pt-6 border-t">
              <Button
                variant="destructive"
                onClick={async () => {
                  await auth.signOut()
                  router.push('/auth/sign-in')
                }}
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}

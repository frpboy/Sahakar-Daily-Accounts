'use client'

import { SignUpForm, authLocalization } from '@neondatabase/auth/react'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Sahakar Accounts</h1>
            <p className="text-slate-500 mt-2">Create an account to get started</p>
          </div>
          
          <SignUpForm localization={authLocalization} />
          
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/auth/sign-in" className="text-blue-600 font-medium hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

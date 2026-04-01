'use client'

import { ResetPasswordForm, authLocalization } from '@neondatabase/auth/react'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
            <p className="text-slate-500 mt-2">Enter your new password below</p>
          </div>
          
          <ResetPasswordForm localization={authLocalization} />
        </div>
      </div>
    </div>
  );
}

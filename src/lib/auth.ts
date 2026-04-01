'use client'

import { createAuthClient } from "@neondatabase/neon-js/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react";

export const auth = createAuthClient(process.env.NEXT_PUBLIC_NEON_AUTH_URL!, {
  adapter: BetterAuthReactAdapter(),
});

export type Session = ReturnType<typeof auth.useSession>['data'];
export type User = NonNullable<Session> extends { user: infer U } ? U | null : null;


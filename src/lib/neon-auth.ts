// TODO: Replace with actual Neon Auth implementation
// import { NeonClient } from "@neondatabase/neon-js";

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;

if (!authUrl) {
  console.warn("NEXT_PUBLIC_NEON_AUTH_URL environment variable is not set");
}

// Placeholder types for future Neon Auth integration
export type User = {
  id: string;
  email: string;
  metadata?: Record<string, any>;
};

export type Session = {
  id: string;
  userId: string;
  expiresAt?: Date;
};

// Placeholder client that throws error when used
export const neonClient = {
  auth: {
    user: () => {
      throw new Error("Neon Auth client not configured");
    },
    session: () => {
      throw new Error("Neon Auth client not configured");
    },
  },
};

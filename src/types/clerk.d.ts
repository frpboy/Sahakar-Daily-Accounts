declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role: "admin" | "manager";
      outletId?: string;
    };
  }
}

export {};

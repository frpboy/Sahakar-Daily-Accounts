import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth({
  publicPaths: ["/login"],
  isReturnToCurrentPage: true,
  loginPage: "/login",
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from "next/server"

const ispublicRoutes = createRouteMatcher([
  "/",
  "/api/webhook/register",
  "/sign-up",
  "/sign-in"
])

const authRoutes = ["/sign-in", "/sign-up"]

export default clerkMiddleware(async (auth,req) => {
  // handle unauth user trying to access protected routes
  
  const {userId} = await auth()
  
  if (!ispublicRoutes(req)) {
    await auth.protect()
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }
  
  if (userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId)
      const role = user.publicMetadata.role as string | undefined
  
      //admine role redirection
      if (role === "admin" && req.nextUrl.pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url))
      }
  
      //prevent non admin user to access the admin routes
      if (role !== "admin" && req.nextUrl.pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
  
      //redirect auth user trying to access public routes
      if (authRoutes.includes(req.nextUrl.pathname)) {
        return NextResponse.redirect(
          new URL(
            role === "admin" ? "/admin/dashboard" : "/dashboard",
            req.url
          )
        )
      }
    } catch (error) {
      console.error(error)
      return NextResponse.redirect(new URL("/error", req.url))
    }

  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export default async function authMiddleware(req, res, next) {
  try {
    const debugPath = `${req.method} ${req.originalUrl}`;

    // First, try standard cookie-based session (works on web)
    let session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    // Fallback: check custom header (works on native where Cookie header may be stripped)
    if (!session && req.headers["x-better-auth-cookie"]) {
      const fakeHeaders = new Headers();
      fakeHeaders.set("cookie", req.headers["x-better-auth-cookie"]);
      session = await auth.api.getSession({ headers: fakeHeaders });
    }

    if (!session) {
      const hasCookieHeader = !!req.headers.cookie;
      const hasCustomHeader = !!req.headers["x-better-auth-cookie"];
      console.warn(
        `[Auth] 401 on ${debugPath} — cookie header: ${hasCookieHeader ? `"${req.headers.cookie?.substring(0, 60)}..."` : "NONE"}, x-better-auth-cookie: ${hasCustomHeader ? "present" : "NONE"}`
      );
      return res.status(401).json({ message: "Not authenticated" });
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role || "Student",
    };
    req.session = session.session;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Invalid session" });
  }
}
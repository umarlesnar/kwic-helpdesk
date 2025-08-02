//lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { Database } from "./database";
import { User } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "agent" | "admin";
}

export async function signToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  // In a real app, you'd verify the password hash
  // For demo purposes, we'll accept any password
  let user = await Database.getUserByEmail(email);
  if (Array.isArray(user)) user = user[0];
  if (!user) return null;
  // Map to User type

  if (user.auth_type !== "local") {
    // If using OAuth or SSO, return user without password check
    //call api to verify OAuth/SSO token if needed
    console.log("User authenticated via OAuth/SSO:", email);

    try {
      const response = await fetch(
        `${process.env.KWIC_SSO_URL}/api/auth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );
    } catch (error) {
      console.error("Error verifying OAuth/SSO token:", error);
      console.log("OAuth/SSO token verification failed for user:", email);
      return null;
    }

    return {
      id: user._id?.toString?.() || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      // ...add other fields as needed
    } as User;
  } else if (!user.password || !(await user.comparePassword(password))) {
    console.log("Invalid credentials for user:", email);
    return null;
  }

  return {
    id: user._id?.toString?.() || user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    // ...add other fields as needed
  } as User;
}

export async function getSessionFromRequest(
  request: Request
): Promise<SessionUser | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      console.log("No authorization header found");
      return null;
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token || token === "Bearer") {
      console.log("No token found in authorization header");
      return null;
    }

    const session = await verifyToken(token);
    if (!session) {
      console.log("Token verification failed");
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error getting session from request:", error);
    return null;
  }
}

export async function getAssignedTicketsForUser(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return [];
  const tickets = await Database.getTickets({ assigneeId: session.id });
  return tickets;
}

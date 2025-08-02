//app/api/install/route.ts
import { connectToDatabase, initializeDefaultData } from "@/lib/schemas";

export async function GET(req: Request) {
  try {
    // Initialize database connection
    await connectToDatabase();

    // Initialize default data if needed
    await initializeDefaultData();

    return new Response("Installation successful", { status: 200 });
  } catch (error) {
    console.error("Installation error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

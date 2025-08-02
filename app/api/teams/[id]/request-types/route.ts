// app/api/teams/[id]/request-types/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { getSessionFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// Add request type to team
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = params.id;
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const body = await request.json();
    const requestTypeId = body.requestTypeId;

    if (!ObjectId.isValid(requestTypeId)) {
      return NextResponse.json(
        { error: "Invalid request type ID" },
        { status: 400 }
      );
    }

    // Check if request type exists
    const requestType = await Database.getRequestTypeById(requestTypeId);
    if (!requestType) {
      return NextResponse.json(
        { error: "Request type not found" },
        { status: 404 }
      );
    }

    const updatedTeam = await Database.addTeamRequestType(
      teamId,
      requestTypeId
    );
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("Add team request type error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove request type from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = params.id;
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const body = await request.json();
    const requestTypeId = body.requestTypeId;

    if (!ObjectId.isValid(requestTypeId)) {
      return NextResponse.json(
        { error: "Invalid request type ID" },
        { status: 400 }
      );
    }

    const updatedTeam = await Database.removeTeamRequestType(
      teamId,
      requestTypeId
    );
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("Remove team request type error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Bulk assign request types to team
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const teamId = params.id;
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }
    const body = await request.json();
    const requestTypeIds = Array.isArray(body.requestTypeIds)
      ? body.requestTypeIds
      : [];
    if (!requestTypeIds.every((id: string) => ObjectId.isValid(id))) {
      return NextResponse.json(
        { error: "Invalid request type IDs" },
        { status: 400 }
      );
    }

    const updatedTeam = await Database.updateTeam(teamId, {
      requestTypes: requestTypeIds,
    });
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("Bulk assign team request types error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

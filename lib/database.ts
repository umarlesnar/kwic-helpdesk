//lib/database.ts
import {
  User,
  Team,
  RequestType,
  Ticket,
  TicketActivity,
  connectToDatabase,
} from "@/lib/schemas";
import { SystemSettings } from "@/lib/schemas/systemSettings.schema";
import { Types } from "mongoose";

// Database simulation functions
export class Database {
  static updateUser: any;
  // User operations
  static async getUsers() {
    await connectToDatabase();
    return User.find({}).lean();
  }

  static async getUserById(id: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return User.findById(id).lean();
  }

  static async getUserByEmail(email: string) {
    await connectToDatabase();
    return User.findOne({ email });
  }

  static async createUser(user: any) {
    await connectToDatabase();
    const newUser = new User({ ...user });
    await newUser.save();
    return newUser.toObject();
  }

  // Enhanced Team operations
  static async getTeams(
    options: {
      populateMembers?: boolean;
      populateRequestTypes?: boolean;
      populateLead?: boolean;
      isActive?: boolean;
    } = {}
  ) {
    await connectToDatabase();

    let query = Team.find({});

    if (options.isActive !== undefined) {
      query = query.where("isActive").equals(options.isActive);
    }

    if (options.populateMembers) {
      query = query.populate("members", "name email role avatar");
    }

    if (options.populateRequestTypes) {
      query = query.populate(
        "requestTypes",
        "name description priority isActive"
      );
    }

    if (options.populateLead) {
      query = query.populate("leadId", "name email avatar");
    }

    return query.sort({ createdAt: -1 }).lean();
  }

  static async getTeamById(
    id: string,
    options: {
      populateMembers?: boolean;
      populateRequestTypes?: boolean;
      populateLead?: boolean;
    } = {}
  ) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;

    let query = Team.findById(id);

    if (options.populateMembers) {
      query = query.populate("members", "name email role avatar");
    }

    if (options.populateRequestTypes) {
      query = query.populate(
        "requestTypes",
        "name description priority isActive"
      );
    }

    if (options.populateLead) {
      query = query.populate("leadId", "name email avatar");
    }

    return query.lean();
  }

  static async createTeam(teamData: any) {
    await connectToDatabase();
    // Only use values provided by the UI
    const newTeam = new Team({ ...teamData });
    await newTeam.save();
    return newTeam.toObject();
  }

  static async updateTeam(id: string, updates: any) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;

    return Team.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
      .populate("members", "name email role avatar")
      .populate("requestTypes", "name description priority isActive")
      .populate("leadId", "name email avatar")
      .lean();
  }

  static async deleteTeam(id: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;

    return Team.findByIdAndDelete(id).lean();
  }

  static async addTeamMember(teamId: string, userId: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(userId))
      return null;

    return Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { members: userId } },
      { new: true }
    )
      .populate("members", "name email role avatar")
      .populate("requestTypes", "name description priority isActive")
      .populate("leadId", "name email avatar")
      .lean();
  }

  static async removeTeamMember(teamId: string, userId: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(userId))
      return null;

    return Team.findByIdAndUpdate(
      teamId,
      { $pull: { members: userId } },
      { new: true }
    )
      .populate("members", "name email role avatar")
      .populate("requestTypes", "name description priority isActive")
      .populate("leadId", "name email avatar")
      .lean();
  }

  static async addTeamRequestType(teamId: string, requestTypeId: string) {
    await connectToDatabase();
    if (
      !Types.ObjectId.isValid(teamId) ||
      !Types.ObjectId.isValid(requestTypeId)
    )
      return null;

    return Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { requestTypes: requestTypeId } },
      { new: true }
    )
      .populate("members", "name email role avatar")
      .populate("requestTypes", "name description priority isActive")
      .populate("leadId", "name email avatar")
      .lean();
  }

  static async removeTeamRequestType(teamId: string, requestTypeId: string) {
    await connectToDatabase();
    if (
      !Types.ObjectId.isValid(teamId) ||
      !Types.ObjectId.isValid(requestTypeId)
    )
      return null;

    return Team.findByIdAndUpdate(
      teamId,
      { $pull: { requestTypes: requestTypeId } },
      { new: true }
    )
      .populate("members", "name email role avatar")
      .populate("requestTypes", "name description priority isActive")
      .populate("leadId", "name email avatar")
      .lean();
  }

  static async setTeamLead(teamId: string, userId: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(userId))
      return null;

    return Team.findByIdAndUpdate(teamId, { leadId: userId }, { new: true })
      .populate("members", "name email role avatar")
      .populate("requestTypes", "name description priority isActive")
      .populate("leadId", "name email avatar")
      .lean();
  }

  static async updateTeamSettings(teamId: string, settings: any) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(teamId)) return null;

    return Team.findByIdAndUpdate(teamId, { $set: { settings } }, { new: true })
      .populate("members", "name email role avatar")
      .populate("requestTypes", "name description priority isActive")
      .populate("leadId", "name email avatar")
      .lean();
  }

  static async updateTeamMetrics(teamId: string, metrics: any) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(teamId)) return null;

    return Team.findByIdAndUpdate(teamId, { $set: { metrics } }, { new: true })
      .populate("members", "name email role avatar")
      .populate("requestTypes", "name description priority isActive")
      .populate("leadId", "name email avatar")
      .lean();
  }

  // Request Type operations
  static async getRequestTypes(options: { includeInactive?: boolean } = {}) {
    await connectToDatabase();
    if (options.includeInactive) {
      return RequestType.find({}).lean();
    }
    return RequestType.find({ isActive: true }).lean();
  }

  static async getRequestTypeById(id: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return RequestType.findById(id).lean();
  }

  static async createRequestType(requestType: any) {
    await connectToDatabase();
    const newRequestType = new RequestType({ ...requestType });
    await newRequestType.save();
    return newRequestType.toObject();
  }

  static async updateRequestType(id: string, updates: any) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return RequestType.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  static async deleteRequestType(id: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return RequestType.findByIdAndDelete(id).lean();
  }

  // Ticket operations
  static async getTickets(filters?: {
    customerId?: string;
    assigneeId?: string;
    status?: string[];
    priority?: string[];
  }) {
    await connectToDatabase();
    const query: any = {};
    if (filters?.customerId && Types.ObjectId.isValid(filters.customerId)) {
      query.customerId = filters.customerId;
    }
    if (filters?.assigneeId && Types.ObjectId.isValid(filters.assigneeId)) {
      // Only return tickets where assigneeId is set and matches
      query.assigneeId = { $eq: filters.assigneeId };
    }
    if (filters?.status?.length) {
      query.status = { $in: filters.status };
    }
    if (filters?.priority?.length) {
      query.priority = { $in: filters.priority };
    }
    return Ticket.find(query).sort({ updatedAt: -1 }).lean();
  }

  static async getTicketById(id: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Ticket.findById(id).lean();
  }

  static async createTicket(ticket: any) {
    await connectToDatabase();
    const newTicket = new Ticket({ ...ticket });
    await newTicket.save();
    return newTicket.toObject();
  }

  static async updateTicket(id: string, updates: any) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Ticket.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  // Activity operations
  static async getTicketActivities(ticketId: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(ticketId)) return [];
    return TicketActivity.find({ ticketId }).sort({ createdAt: 1 }).lean();
  }

  static async createActivity(activity: any) {
    await connectToDatabase();
    const newActivity = new TicketActivity({ ...activity });
    await newActivity.save();
    return newActivity.toObject();
  }



  // Dashboard metrics
  static async getDashboardMetrics() {
    await connectToDatabase();
    const tickets = await Ticket.find({}).lean();
    const activities = await TicketActivity.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const statusCounts = tickets.reduce((acc: any, ticket: any) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    const priorityCounts = tickets.reduce((acc: any, ticket: any) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    const dueSoonTickets = tickets.filter((ticket: any) => {
      if (!ticket.dueDate) return false;
      const now = new Date();
      const timeDiff = new Date(ticket.dueDate).getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      return hoursDiff <= 24 && hoursDiff > 0;
    });

    return {
      totalTickets: tickets.length,
      openTickets: tickets.filter((t: any) =>
        ["open", "in_progress", "pending"].includes(t.status)
      ).length,
      resolvedTickets: tickets.filter((t: any) => t.status === "resolved")
        .length,
      avgResolutionTime: 24, // Placeholder
      ticketsByStatus: statusCounts,
      ticketsByPriority: priorityCounts,
      recentActivity: activities,
      dueSoonTickets,
    };
  }

  // System Settings operations
  static async getSystemSettings() {
    await connectToDatabase();
    // Always return the first (and only) settings doc
    return SystemSettings.findOne({}).lean();
  }
  static async updateSystemSettings(updates: any) {
    await connectToDatabase();
    // Upsert: update if exists, otherwise create
    return SystemSettings.findOneAndUpdate({}, updates, {
      new: true,
      upsert: true,
    }).lean();
  }

  static async getAgents() {
    await connectToDatabase();
    return User.find({ role: "agent" }).lean();
  }
}

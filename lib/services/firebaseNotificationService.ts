//lib/services/firebaseNotificationService.ts
import { FCMToken, IFCMToken } from "@/lib/schemas/fcmToken.schema";
import { User } from "@/lib/schemas/user.schema";

export interface FirebaseNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  clickAction?: string;
  data?: Record<string, string>;
  sound?: string;
  priority?: "normal" | "high";
  timeToLive?: number;
}

export interface NotificationTargets {
  userId?: string;
  userIds?: string[];
  roles?: ("customer" | "agent" | "admin")[];
  tokens?: string[];
  topic?: string;
}

export class FirebaseNotificationService {
  /**
   * Register FCM token for a user
   */
  static async registerToken(
    userId: string,
    token: string,
    deviceInfo?: any
  ): Promise<IFCMToken> {
    try {
      // Remove existing token if it exists
      await FCMToken.deleteMany({ token });

      // Create new token record
      const fcmToken = new FCMToken({
        userId,
        token,
        deviceInfo,
        isActive: true,
        lastUsed: new Date(),
      });

      await fcmToken.save();
      console.log(`FCM token registered for user ${userId}`);
      return fcmToken;
    } catch (error) {
      console.error("Error registering FCM token:", error);
      throw new Error("Failed to register FCM token");
    }
  }

  /**
   * Unregister FCM token
   */
  static async unregisterToken(userId: string, token?: string): Promise<void> {
    try {
      const query: any = { userId };
      if (token) {
        query.token = token;
      }

      await FCMToken.updateMany(query, { isActive: false });
      console.log(`FCM token unregistered for user ${userId}`);
    } catch (error) {
      console.error("Error unregistering FCM token:", error);
      throw new Error("Failed to unregister FCM token");
    }
  }

  /**
   * Send notification to specific targets
   */
  static async sendNotification(
    payload: FirebaseNotificationPayload,
    targets: NotificationTargets
  ): Promise<{
    success: number;
    failure: number;
    errors: any[];
  }> {
    try {
      console.log("Sending Firebase notification:", payload.title);

      // Check if Firebase Admin is available
      const { adminMessaging } = await import("@/lib/firebase/admin");
      if (!adminMessaging) {
        console.warn("Firebase Admin not configured, skipping notification");
        return {
          success: 0,
          failure: 0,
          errors: ["Firebase Admin not configured"],
        };
      }

      // Get target tokens
      const tokens = await this.getTargetTokens(targets);

      if (tokens.length === 0) {
        console.log("No FCM tokens found for notification");
        return { success: 0, failure: 0, errors: [] };
      }

      // Prepare message
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.image,
        },
        data: {
          ...payload.data,
          clickAction: payload.clickAction || "/",
          tag: payload.tag || "default",
          timestamp: Date.now().toString(),
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || "/icons/notification-icon.png",
            badge: payload.badge || "/icons/badge-icon.png",
            image: payload.image,
            tag: payload.tag,
            requireInteraction: payload.priority === "high",
            actions: [
              {
                action: "view",
                title: "View",
                icon: "/icons/view-icon.png",
              },
              {
                action: "dismiss",
                title: "Dismiss",
              },
            ],
            data: {
              ...payload.data,
              clickAction: payload.clickAction || "/",
            },
          },
          fcmOptions: {
            link: payload.clickAction || "/",
          },
        },
      };

      // Send to multiple tokens
      if (tokens.length === 1) {
        // Single token
        const response = await adminMessaging.send({
          ...message,
          token: tokens[0],
        });

        console.log("Firebase notification sent successfully:", response);
        return { success: 1, failure: 0, errors: [] };
      } else {
        // Multiple tokens
        const response = await adminMessaging.sendEachForMulticast({
          ...message,
          tokens,
        });

        // Handle invalid tokens
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp: any, idx: number) => {
            if (!resp.success) {
              failedTokens.push(tokens[idx]);
              console.error(
                "Failed to send to token:",
                tokens[idx],
                resp.error
              );
            }
          });

          // Deactivate invalid tokens
          await this.deactivateTokens(failedTokens);
        }

        console.log(
          `Firebase notifications sent: ${response.successCount} success, ${response.failureCount} failure`
        );

        return {
          success: response.successCount,
          failure: response.failureCount,
          errors: response.responses
            .filter((resp: any) => !resp.success)
            .map((resp: any) => resp.error),
        };
      }
    } catch (error) {
      console.error("Error sending Firebase notification:", error);
      return { success: 0, failure: 1, errors: [error] };
    }
  }

  /**
   * Get target tokens based on criteria
   */
  private static async getTargetTokens(
    targets: NotificationTargets
  ): Promise<string[]> {
    try {
      if (targets.tokens) {
        return targets.tokens;
      }

      const query: any = { isActive: true };

      if (targets.userId) {
        query.userId = targets.userId;
      } else if (targets.userIds?.length) {
        query.userId = { $in: targets.userIds };
      } else if (targets.roles?.length) {
        // Get users by roles
        const users = await User.find({ role: { $in: targets.roles } }).select(
          "_id"
        );
        query.userId = { $in: users.map((u) => u._id) };
      }

      const fcmTokens = await FCMToken.find(query).select("token");
      return fcmTokens.map((t) => t.token);
    } catch (error) {
      console.error("Error getting target tokens:", error);
      return [];
    }
  }

  /**
   * Deactivate invalid tokens
   */
  private static async deactivateTokens(tokens: string[]): Promise<void> {
    try {
      await FCMToken.updateMany(
        { token: { $in: tokens } },
        { isActive: false }
      );
      console.log(`Deactivated ${tokens.length} invalid FCM tokens`);
    } catch (error) {
      console.error("Error deactivating tokens:", error);
    }
  }

  /**
   * Send ticket-related notifications
   */
  static async sendTicketNotification(
    type: "created" | "updated" | "assigned" | "resolved" | "comment",
    ticket: any,
    options: {
      excludeUserId?: string;
      comment?: any;
    } = {}
  ): Promise<void> {
    try {
      let title = "";
      let body = "";
      let icon = "/icons/ticket-icon.png";
      let tag = `ticket-${ticket.id}`;
      let clickAction = "";
      let priority: "normal" | "high" = "normal";

      switch (type) {
        case "created":
          title = "🎫 New Ticket Created";
          body = `${ticket.title} - Priority: ${ticket.priority}`;
          clickAction = `/support/tickets/${ticket.id}`;
          priority =
            ticket.priority === "critical" || ticket.priority === "high"
              ? "high"
              : "normal";
          break;
        case "updated":
          title = "📝 Ticket Updated";
          body = `${ticket.title} has been updated`;
          clickAction = `/support/tickets/${ticket.id}`;
          break;
        case "assigned":
          title = "👤 Ticket Assigned";
          body = `You have been assigned to: ${ticket.title}`;
          clickAction = `/support/tickets/${ticket.id}`;
          priority = "high";
          break;
        case "resolved":
          title = "✅ Ticket Resolved";
          body = `Your ticket "${ticket.title}" has been resolved`;
          icon = "/icons/success-icon.png";
          clickAction = `/customer/tickets/${ticket.id}`;
          break;
        case "comment":
          title = "💬 New Comment";
          body = `New comment on: ${ticket.title}`;
          clickAction = `/support/tickets/${ticket.id}`;
          if (options.comment) {
            body = `${
              options.comment.user?.name || "Someone"
            } commented: ${options.comment.content.substring(0, 50)}...`;
          }
          break;
      }

      // Determine target users
      const targetUserIds: string[] = [];

      if (type === "assigned" && ticket.assigneeId) {
        targetUserIds.push(ticket.assigneeId);
      } else if (type === "resolved" && ticket.customerId) {
        targetUserIds.push(ticket.customerId);
      } else {
        // Notify all participants except the user who triggered the action
        targetUserIds.push(
          ...ticket.participants.filter(
            (id: string) => id !== options.excludeUserId
          )
        );
      }

      if (targetUserIds.length === 0) return;

      await this.sendNotification(
        {
          title,
          body,
          icon,
          tag,
          clickAction,
          priority,
          data: {
            type: "ticket",
            ticketId: ticket.id,
            action: type,
            priority: ticket.priority,
          },
        },
        {
          userIds: targetUserIds,
        }
      );
    } catch (error) {
      console.error("Error sending Firebase ticket notification:", error);
    }
  }

  /**
   * Get FCM token statistics
   */
  static async getTokenStats(): Promise<{
    total: number;
    active: number;
    byPlatform: any[];
    byUser: any[];
  }> {
    try {
      const [total, active, byPlatform, byUser] = await Promise.all([
        FCMToken.countDocuments(),
        FCMToken.countDocuments({ isActive: true }),
        FCMToken.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: "$deviceInfo.platform", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        FCMToken.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: "$userId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

      return { total, active, byPlatform, byUser };
    } catch (error) {
      console.error("Error getting FCM token stats:", error);
      return { total: 0, active: 0, byPlatform: [], byUser: [] };
    }
  }
}

//lib/utils/ticketUtils.ts
import mongoose from "mongoose";
import Counter from "@/lib/schemas/counter.schema"; // Assuming you have a counter schema/model defined

interface GenerateTicketNumberOptions {
  prefix?: string;
  suffix?: string;
  padding?: number;
}

export class TicketUtils {
  /**
   * Generates the next ticket number.
   * @param options - Optional configuration for prefix, suffix, and padding.
   * @returns An object containing the sequence number and the formatted ticket number.
   */
  static async generateTicketNumber(
    options: GenerateTicketNumberOptions = {}
  ): Promise<{ sequence: number; ticketNumber: string }> {
    const { prefix = "TKT-", suffix = "", padding = 6 } = options;

    // Ensure database connection is open if you are not using a global connection helper
    if (mongoose.connection.readyState !== 1) {
      // Assuming you have a database connection function, call it here
      // await connectToDatabase();
      console.warn(
        "Mongoose connection not open. Ensure your database connection is established."
      );
    }

    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: "ticketNumber" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true } // Create if it doesn't exist, return the updated document
      );

      const sequence = counter.sequence_value;
      const paddedSequence = sequence.toString().padStart(padding, "0");
      const ticketNumber = `${prefix}${paddedSequence}${suffix}`;

      return { sequence, ticketNumber };
    } catch (error) {
      console.error("Error generating ticket number:", error);
      throw new Error("Failed to generate ticket number.");
    }
  }

  /**
   * Validates a ticket number string against the expected format.
   * @param ticketNumber - The ticket number string to validate.
   * @param options - Optional configuration for prefix, suffix, and padding to validate against.
   * @returns True if the ticket number is valid, false otherwise.
   */
  static validateTicketNumber(
    ticketNumber: string,
    options: GenerateTicketNumberOptions = {}
  ): boolean {
    const { prefix = "TKT-", suffix = "", padding = 6 } = options;

    // Create a regex pattern based on the expected format
    const pattern = new RegExp(
      `^${prefix}\\d{${padding}}${suffix.replace(
        /[-\/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}$`
    );

    return pattern.test(ticketNumber);
  }

  /**
   * Extracts the sequence number from a ticket number string.
   * @param ticketNumber - The ticket number string.
   * @param options - Optional configuration for prefix and suffix to help with extraction.
   * @returns The extracted sequence number, or null if extraction fails.
   */
  static extractSequenceFromTicketNumber(
    ticketNumber: string,
    options: GenerateTicketNumberOptions = {}
  ): number | null {
    const { prefix = "TKT-", suffix = "" } = options;

    if (!ticketNumber.startsWith(prefix) || !ticketNumber.endsWith(suffix)) {
      return null;
    }

    const sequenceString = ticketNumber.substring(
      prefix.length,
      ticketNumber.length - suffix.length
    );

    const sequence = parseInt(sequenceString, 10);

    if (isNaN(sequence)) {
      return null;
    }

    return sequence;
  }
}

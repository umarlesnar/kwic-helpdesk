//lib/schemas/user.schema.ts
import { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  auth_type?: "local" | "oauth" | "sso";
  email: string;
  name: string;
  password: string;
  role: "customer" | "agent" | "admin";
  teamId?: Schema.Types.ObjectId;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  preferences: {
    notifications: {
      email: boolean;
      browser: boolean;
      ticketUpdates: boolean;
      comments: boolean;
    };
    theme: "light" | "dark" | "system";
    language: string;
    timezone: string;
  };
  profile: {
    phone?: string;
    company?: string;
    department?: string;
    jobTitle?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    auth_type: {
      type: String,
      enum: ["local", "oauth", "sso"],
      default: "local",
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Password is optional for OAuth/SSO users
      maxlength: 50,
    },
    role: {
      type: String,
      enum: ["customer", "agent", "admin"],
      default: "customer",
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      index: true,
    },
    avatar: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        browser: { type: Boolean, default: true },
        ticketUpdates: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
      },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      language: {
        type: String,
        default: "en",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    profile: {
      phone: String,
      company: String,
      department: String,
      jobTitle: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return this.name;
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (this.auth_type !== "local") {
    // If using OAuth or SSO, skip password hashing
    this.password = "";
    return next();
  }
  // If not using local auth, skip password hashing
  // In production, hash the password here
  const bcrypt = require("bcryptjs");
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // In production, compare hashed passwords

  if (this.auth_type !== "local") {
    // If using OAuth or SSO, skip password comparison
    return true;
  }

  const bcrypt = require("bcryptjs");
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = models.User || model<IUser>("User", userSchema);

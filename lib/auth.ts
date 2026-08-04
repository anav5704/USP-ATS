import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

function splitName(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0],
    last: parts.slice(1).join(" ") || null,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
      },
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: process.env.MICROSOFT_TENANT_ID,
      authority: "https://login.microsoftonline.com",
      prompt: "select_account",
      mapProfileToUser: (profile) => {
        const roles = Array.isArray(profile.roles) ? profile.roles : [];
        const firstName =
          profile.given_name ?? profile.givenName ?? splitName(profile.name).first;
        const lastName =
          profile.family_name ?? profile.surname ?? splitName(profile.name).last;
        return {
          role: roles[0] ?? null,
          firstName,
          lastName,
        };
      },
    },
  },
  plugins: [nextCookies()],
});

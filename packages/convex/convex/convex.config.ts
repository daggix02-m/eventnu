import { defineApp } from "convex/server";
import { v } from "convex/values";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp({
  env: {
    FACEBOOK_APP_ID: v.optional(v.string()),
    FACEBOOK_APP_SECRET: v.optional(v.string()),
    INSTAGRAM_VERIFY_TOKEN: v.optional(v.string()),
    INSTAGRAM_ENCRYPTION_KEY: v.optional(v.string()),
    ADMIN_APP_URL: v.optional(v.string()),
    CONVEX_SITE_URL: v.optional(v.string()),
  },
});

app.use(rateLimiter);

export default app;

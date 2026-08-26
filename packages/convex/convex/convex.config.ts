import { defineApp } from 'convex/server'
import { v } from 'convex/values'
import rateLimiter from '@convex-dev/rate-limiter/convex.config'

const app = defineApp({
  env: {
    ADMIN_APP_URL: v.optional(v.string()),
    CONVEX_SITE_URL: v.optional(v.string()),
    SITE_URL: v.optional(v.string()),
    ADMIN_BOOTSTRAP_KEY: v.optional(v.string()),
    ADMIN_BOOTSTRAP_PASSWORD: v.optional(v.string()),
    ADMIN_EMAIL: v.optional(v.string()),
    RESEND_API_KEY: v.optional(v.string()),
    RESEND_FROM: v.optional(v.string()),
  },
})

app.use(rateLimiter)

export default app

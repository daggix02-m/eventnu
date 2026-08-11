/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminSettings from "../adminSettings.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as bookmarks from "../bookmarks.js";
import type * as categories from "../categories.js";
import type * as cms from "../cms.js";
import type * as comments from "../comments.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as email from "../email.js";
import type * as events_enrichment from "../events/enrichment.js";
import type * as events_moderation from "../events/moderation.js";
import type * as events_read from "../events/read.js";
import type * as events_write from "../events/write.js";
import type * as experiencePosts from "../experiencePosts.js";
import type * as features from "../features.js";
import type * as follows from "../follows.js";
import type * as helpers from "../helpers.js";
import type * as hosts from "../hosts.js";
import type * as http from "../http.js";
import type * as instagram_connect from "../instagram/connect.js";
import type * as instagram_crypto from "../instagram/crypto.js";
import type * as instagram_import from "../instagram/import.js";
import type * as instagram_publish from "../instagram/publish.js";
import type * as instagram_shared from "../instagram/shared.js";
import type * as likes from "../likes.js";
import type * as migrations from "../migrations.js";
import type * as moderation from "../moderation.js";
import type * as notifications from "../notifications.js";
import type * as organizers from "../organizers.js";
import type * as profiles from "../profiles.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as reports from "../reports.js";
import type * as reservations from "../reservations.js";
import type * as seed from "../seed.js";
import type * as shares from "../shares.js";
import type * as support from "../support.js";
import type * as verifyPassword from "../verifyPassword.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminSettings: typeof adminSettings;
  analytics: typeof analytics;
  auth: typeof auth;
  bookmarks: typeof bookmarks;
  categories: typeof categories;
  cms: typeof cms;
  comments: typeof comments;
  constants: typeof constants;
  crons: typeof crons;
  dashboard: typeof dashboard;
  email: typeof email;
  "events/enrichment": typeof events_enrichment;
  "events/moderation": typeof events_moderation;
  "events/read": typeof events_read;
  "events/write": typeof events_write;
  experiencePosts: typeof experiencePosts;
  features: typeof features;
  follows: typeof follows;
  helpers: typeof helpers;
  hosts: typeof hosts;
  http: typeof http;
  "instagram/connect": typeof instagram_connect;
  "instagram/crypto": typeof instagram_crypto;
  "instagram/import": typeof instagram_import;
  "instagram/publish": typeof instagram_publish;
  "instagram/shared": typeof instagram_shared;
  likes: typeof likes;
  migrations: typeof migrations;
  moderation: typeof moderation;
  notifications: typeof notifications;
  organizers: typeof organizers;
  profiles: typeof profiles;
  rateLimiter: typeof rateLimiter;
  reports: typeof reports;
  reservations: typeof reservations;
  seed: typeof seed;
  shares: typeof shares;
  support: typeof support;
  verifyPassword: typeof verifyPassword;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};

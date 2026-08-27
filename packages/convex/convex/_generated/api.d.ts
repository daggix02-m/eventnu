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
import type * as authErrors from "../authErrors.js";
import type * as bookmarks from "../bookmarks.js";
import type * as categories from "../categories.js";
import type * as cms_announcements from "../cms/announcements.js";
import type * as cms_contact from "../cms/contact.js";
import type * as cms_pages from "../cms/pages.js";
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
import type * as http from "../http.js";
import type * as likes from "../likes.js";
import type * as migrations from "../migrations.js";
import type * as moderation from "../moderation.js";
import type * as notifications from "../notifications.js";
import type * as organizerSettings from "../organizerSettings.js";
import type * as organizers from "../organizers.js";
import type * as profiles from "../profiles.js";
import type * as publicEventCards from "../publicEventCards.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as reports from "../reports.js";
import type * as reservations from "../reservations.js";
import type * as seed from "../seed.js";
import type * as shares from "../shares.js";
import type * as stories from "../stories.js";
import type * as storyCategories from "../storyCategories.js";
import type * as support from "../support.js";
import type * as verification from "../verification.js";

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
  authErrors: typeof authErrors;
  bookmarks: typeof bookmarks;
  categories: typeof categories;
  "cms/announcements": typeof cms_announcements;
  "cms/contact": typeof cms_contact;
  "cms/pages": typeof cms_pages;
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
  http: typeof http;
  likes: typeof likes;
  migrations: typeof migrations;
  moderation: typeof moderation;
  notifications: typeof notifications;
  organizerSettings: typeof organizerSettings;
  organizers: typeof organizers;
  profiles: typeof profiles;
  publicEventCards: typeof publicEventCards;
  rateLimiter: typeof rateLimiter;
  reports: typeof reports;
  reservations: typeof reservations;
  seed: typeof seed;
  shares: typeof shares;
  stories: typeof stories;
  storyCategories: typeof storyCategories;
  support: typeof support;
  verification: typeof verification;
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

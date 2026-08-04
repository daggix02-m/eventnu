import type { Metadata } from "next";
import { AboutContent } from "./AboutContent";

export const metadata: Metadata = {
  title: "About | Event Nu",
  description: "Learn more about Event Nu, your discovery platform for events in Addis Ababa.",
};

export default function AboutPage() {
  return <AboutContent />;
}

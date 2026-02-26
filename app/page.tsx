import { redirect } from "next/navigation";

// UI is served by Webflow — redirect away from this path
export default function IndexPage() {
  redirect("/");
}

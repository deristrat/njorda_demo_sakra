import type { UserRole } from "@/types";

/** Return the default landing page for a given role. */
export function getDefaultPath(role: UserRole | null): string {
  return "/start";
}

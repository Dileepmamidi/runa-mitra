import { Badge } from "../ui";

const toneMap = {
  Paid: "brand",
  Cleared: "brand",
  Active: "brand",
  active: "brand",
  verified: "brand",
  "Due Today": "amber",
  Upcoming: "amber",
  pending: "amber",
  pending_verification: "amber",
  Overdue: "rose",
  rejected: "rose",
  High: "rose",
  Medium: "amber",
  Low: "brand"
};

// Pass `label` to show translated text while `status` picks the colour.
export function StatusBadge({ status, label }) {
  return <Badge tone={toneMap[status] || "ink"}>{label || status}</Badge>;
}

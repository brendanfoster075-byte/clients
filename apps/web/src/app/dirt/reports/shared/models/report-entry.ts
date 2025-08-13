import { Icon } from "@bitwarden/icons";

import { ReportVariant } from "./report-variant";

export type ReportEntry = {
  title: string;
  description: string;
  route: string;
  icon: Icon;
  variant: ReportVariant;
};

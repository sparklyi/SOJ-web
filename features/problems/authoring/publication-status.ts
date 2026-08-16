import type { MessageKey } from "@/lib/i18n/messages";
import type { ProblemPublicationStatus } from "@/lib/api/types";

export function publicationStatusMessageKey(status: ProblemPublicationStatus): MessageKey {
  switch (status) {
    case "in_review":
      return "authoring.publicationStatus.inReview";
    case "changes_requested":
      return "authoring.publicationStatus.changesRequested";
    case "published":
      return "authoring.publicationStatus.published";
    case "archived":
      return "authoring.publicationStatus.archived";
    default:
      return "authoring.publicationStatus.draft";
  }
}

export function canSubmitProblemReview(status: ProblemPublicationStatus, publishable: boolean) {
  return publishable && (status === "draft" || status === "changes_requested");
}

import { authoringMessages } from "./authoring";
import { authMessages } from "./auth";
import { contestMessages } from "./contests";
import { coreMessages } from "./core";
import { homeMessages } from "./home";
import { playgroundMessages } from "./playground";
import { problemMessages } from "./problems";
import { rbacMessages } from "./rbac";
import { runMessages } from "./runs";
import { submissionMessages } from "./submissions";
import { systemMessages } from "./system";

export const messages = {
  ...coreMessages,
  ...authMessages,
  ...homeMessages,
  ...playgroundMessages,
  ...problemMessages,
  ...runMessages,
  ...contestMessages,
  ...submissionMessages,
  ...authoringMessages,
  ...rbacMessages,
  ...systemMessages,
} as const;

export type MessageKey = keyof typeof messages;

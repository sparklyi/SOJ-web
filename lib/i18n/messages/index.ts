import { authoringMessages } from "./authoring";
import { authMessages } from "./auth";
import { contestMessages } from "./contests";
import { coreMessages } from "./core";
import { homeMessages } from "./home";
import { problemMessages } from "./problems";
import { submissionMessages } from "./submissions";
import { systemMessages } from "./system";

export const messages = {
  ...coreMessages,
  ...authMessages,
  ...homeMessages,
  ...problemMessages,
  ...contestMessages,
  ...submissionMessages,
  ...authoringMessages,
  ...systemMessages,
} as const;

export type MessageKey = keyof typeof messages;

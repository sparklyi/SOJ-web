import type { TestcaseFinding } from "./types";

export type ApiErrorDetails = {
  findings?: TestcaseFinding[];
};

export type ApiErrorShape = {
  code: string;
  message: string;
  status?: number;
  details?: ApiErrorDetails;
};

function isNotFoundCode(code: string) {
  return code === "not_found" || /(?:^|[._])not_found$/.test(code);
}

function normalizeErrorCode(code: string, status?: number) {
  return status === 404 || isNotFoundCode(code) ? "not_found" : code;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status?: number;
  /** 后端在 apperror 里附带的类型化细节，目前用于测试包 findings。 */
  public readonly details?: ApiErrorDetails;

  constructor(message: string, code: string, status?: number, details?: ApiErrorDetails) {
    super(message);
    this.code = normalizeErrorCode(code, status);
    this.status = status;
    this.details = details;
    this.name = "ApiError";
  }
}

export function notFound(resource: string, id: number | string) {
  return new ApiError(`${resource} ${id} was not found.`, "not_found", 404);
}

export function isNotFoundError(error: unknown) {
  return error instanceof ApiError && error.code === "not_found";
}

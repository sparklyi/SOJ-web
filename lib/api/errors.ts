export type ApiErrorShape = {
  code: string;
  message: string;
  status?: number;
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

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.code = normalizeErrorCode(code, status);
    this.status = status;
    this.name = "ApiError";
  }
}

export function notFound(resource: string, id: number | string) {
  return new ApiError(`${resource} ${id} was not found.`, "not_found", 404);
}

export function isNotFoundError(error: unknown) {
  return error instanceof ApiError && error.code === "not_found";
}

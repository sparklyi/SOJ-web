export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function notFound(resource: string, id: number | string) {
  return new ApiError(`${resource} ${id} was not found.`, "not_found", 404);
}

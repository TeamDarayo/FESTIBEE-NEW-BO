/**
 * 서버가 비-2xx 로 응답했을 때 던지는 에러.
 * BaseResponse 의 `resultCode`(예: CR012)와 HTTP status 를 보존해
 * 호출부가 메시지 문자열 매칭 없이 코드로 분기할 수 있게 한다.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly body: unknown;

  constructor(
    message: string,
    status: number,
    code: string | null,
    body: unknown,
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/** 특정 status(선택) / resultCode 로 응답한 에러인지. */
export function isHttpErrorCode(
  error: unknown,
  code: string,
  status?: number,
): boolean {
  if (!(error instanceof HttpError)) return false;
  if (status !== undefined && error.status !== status) return false;
  return error.code === code;
}

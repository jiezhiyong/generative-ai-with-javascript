// 在使用 toDataStreamResponse 时，出于安全考虑（默认安全），来自 streamText 的错误消息默认会被屏蔽。这可以防止将敏感信息泄露给客户端
// 若需将错误详情转发给客户端或记录错误，请在调用 toDataStreamResponse 时使用 getErrorMessage 函数
export function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}
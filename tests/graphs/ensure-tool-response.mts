import {  AIMessage , BaseMessage , ToolMessage } from "@langchain/core/messages";


export const DO_NOT_RENDER_ID_PREFIX = "do-not-render-";


export function ensureToolCallsHaveResponses(messages: BaseMessage[]): BaseMessage[] {
  const extra: ToolMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i] as AIMessage;
    if (msg.tool_calls?.length) {
      const next = messages[i + 1];
      // Si no hay ToolMessage real a continuación
      if (!next || !(next instanceof ToolMessage)) {
        for (const tc of msg.tool_calls) {
          extra.push(new ToolMessage({
            content: "Successfully handled tool call.",
            tool_call_id: tc.id as string ,
          }));
        }
      }
    }
  }
  return [...messages, ...extra];
}
// Copyright 2026 OpenAI. Modified for CLO AI: validated image input, streaming and transport diagnostics.
// Distributed under third_party/siwc/LICENSE (DevKit Noncommercial License v1.0).
// Transport extension only. OAuth, secret storage and account selection stay in SIWC.
import { validateInput } from './vision-input.cjs';
import OpenAI from "../vendor/siwc/node_modules/openai/index.mjs";
import { ChatGPTError, isObject } from "../vendor/siwc/packages/local/dist/errors.js";
import { responseError } from './response-errors.mjs';
export async function streamResponse(accessToken, options, signal) {
    const input = typeof options.input === "string" ? [{ role: "user", content: options.input }] : options.input;
    validateInput(input);
    // The DevKit supplies the selected ChatGPT account's refreshed OAuth token.
    // Leave org/project unset; they are not placeholders for a Platform API account.
    const client = new OpenAI({
        apiKey: accessToken,
        baseURL: "https://api.openai.com/v1",
        organization: null,
        project: null,
        // Keep the SDK's default without inheriting OPENAI_LOG=debug, which can log submitted text or images.
        logLevel: "warn",
        // Report ChatGPT sharing-limit errors immediately instead of retrying HTTP 429s.
        maxRetries: 0,
        // A redirect can forward the request body to another origin.
        fetchOptions: { redirect: "error" },
        // Also prevent OPENAI_CUSTOM_HEADERS from replacing this account's credentials or tenant.
        defaultHeaders: {
            authorization: `Bearer ${accessToken}`,
            "openai-organization": null,
            "openai-project": null,
        },
    });
    // The SDK's timeout ends at headers; keep the existing deadline on the body too.
    const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(180_000)]);
    let response;
    try {
        const result = await client.responses.create({
            model: options.model,
            input: input.map((message) => ({ role: message.role, content: message.content })),
            ...(options.instructions !== undefined ? { instructions: options.instructions } : {}),
            store: false,
            ...(options.webSearch ? { tools: [{type: "web_search"}], max_tool_calls: 4 } : {}),
            stream: true,
        }, { signal: requestSignal, headers: { accept: "text/event-stream" } }).withResponse();
        response = result.response;
        const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
        // The direct route can return valid SSE without Content-Type. In that case,
        // validate the events below and still require response.completed for success.
        if (!response.body || (contentType && contentType !== "text/event-stream")) {
            await response.body?.cancel();
            throw new ChatGPTError("invalid_stream", "ChatGPT did not return the expected response stream.", true, response.status);
        }
        let completed = false;
        let text = "";
        const sources = [];
        for await (const event of result.data) {
            requestSignal.throwIfAborted();
            if (!isObject(event))
                continue;
            if (event.type === "response.web_search_call.in_progress") options.onSearch?.('Ищу информацию в интернете');
            if (event.type === "response.output_text.annotation.added" && event.annotation?.type === 'url_citation') {
                const a=event.annotation;
                if (typeof a.url==='string' && a.url.startsWith('https://') && !sources.some(s=>s.url===a.url)) sources.push({title:String(a.title||a.url).slice(0,200),url:a.url});
            }
            if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
                text += event.delta;
                if (text.length > 16 * 1024 * 1024)
                    throw new ChatGPTError("response_too_large", "The response was too large. Try a smaller request.");
                options.onDelta?.(event.delta);
            }
            else if (event.type === "response.failed" || event.type === "error") {
                const detail = event.type === "response.failed" ? event.response : event;
                throw responseError(detail, response.status, result.request_id);
            }
            else if (event.type === "response.incomplete") {
                throw new ChatGPTError("response_incomplete", "ChatGPT stopped before completing the response. You can keep the partial text or try again.", true);
            }
            else if (event.type === "response.completed") {
                completed = true;
                break;
            }
        }
        // The SDK may finish iteration on an aborted connection without throwing.
        requestSignal.throwIfAborted();
        if (!completed)
            throw new ChatGPTError("stream_interrupted", "The response ended before completion. You can keep the partial text or try again.", true);
        return { text, sources };
    }
    catch (error) {
        if (signal.aborted)
            throw new ChatGPTError("cancelled", "The response was cancelled.");
        if (error instanceof ChatGPTError)
            throw error;
        // SDK errors can contain submitted text or images. Only expose our sanitized diagnostics,
        // including errors the SDK raises while decoding an SSE 'error' event.
        if (error instanceof OpenAI.APIError && !(error instanceof OpenAI.APIConnectionError) && !(error instanceof OpenAI.APIUserAbortError)) {
            // The SDK also unwraps the string in an OAuth { error: "code" } response.
            const detail = typeof error.error === "string" ? { error: error.error } : error.error;
            throw responseError(detail, error.status ?? response?.status, error.requestID ?? response?.headers.get("x-request-id"));
        }
        if (!response)
            throw new ChatGPTError("network_error", "Could not reach ChatGPT. Check your connection and try again.", true);
        if (error instanceof SyntaxError)
            throw new ChatGPTError("invalid_stream", "The response stream contained an invalid event. Try again.", true);
        throw new ChatGPTError("stream_interrupted", "The connection was interrupted. You can keep the partial text or try again.", true);
    }
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const fallbackBackendOrigin = "http://localhost:4000";

const getBackendOrigin = () => {
  const rawOrigin =
    process.env.INTERNAL_API_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    fallbackBackendOrigin;
  const trimmedOrigin = rawOrigin.replace(/\/$/, "");

  if (
    trimmedOrigin.startsWith("http://") ||
    trimmedOrigin.startsWith("https://")
  ) {
    return trimmedOrigin;
  }

  return `http://${trimmedOrigin}`;
};

const sanitizeRequestHeaders = (request: Request) => {
  const headers = new Headers(request.headers);

  [
    "connection",
    "content-length",
    "host",
    "origin",
    "referer",
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-port",
    "x-forwarded-proto"
  ].forEach((header) => headers.delete(header));

  return headers;
};

const proxyRequest = async (request: Request, context: RouteContext) => {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(
    `${getBackendOrigin()}/api/${path.join("/")}`
  );

  targetUrl.search = incomingUrl.search;

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: sanitizeRequestHeaders(request),
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual"
    });

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: upstreamResponse.headers
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Unable to reach the LMS API.",
        target: targetUrl.toString(),
        details: error instanceof Error ? error.message : "Unknown proxy error."
      },
      {
        status: 502
      }
    );
  }
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
export const HEAD = proxyRequest;

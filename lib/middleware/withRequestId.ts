import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";

export function withRequestId(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = randomUUID();
    res.setHeader("x-request-id", requestId);
    req.headers["x-request-id"] = requestId;
    return handler(req, res);
  };
}


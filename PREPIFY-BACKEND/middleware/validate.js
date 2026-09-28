import { badRequest } from "../utils/httpError.js";

// Validates req[source] against a zod schema and replaces it with the parsed value.
export const validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return next(badRequest(details[0]?.message || "Invalid request", details));
  }
  if (source === "body") req.body = result.data;
  else req.validated = { ...(req.validated || {}), [source]: result.data };
  next();
};

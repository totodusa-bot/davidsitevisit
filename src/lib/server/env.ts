import { z } from "zod";

const serverEnvSchema = z.object({
  VISIT_PASSCODE: z.string().min(1),
  SESSION_SIGNING_KEY: z.string().min(32),
  VISIT_ID: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

let parsedEnv: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (parsedEnv) {
    return parsedEnv;
  }

  parsedEnv = serverEnvSchema.parse(process.env);
  return parsedEnv;
}

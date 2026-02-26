import { NextRequest, NextResponse } from "next/server";
import { getConfig, getEnvFromProcess, sessionCookieOptions } from "@/app/lib/api";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

export async function POST(_req: NextRequest) {
    try {
        let env: CloudflareEnv;
        try {
            const ctx = await getCloudflareContext({ async: true });
            env = ctx.env as CloudflareEnv;
        } catch {
            env = getEnvFromProcess();
        }
        const cfg = getConfig(env);
        const cookieOpts = sessionCookieOptions(cfg);
        const res = NextResponse.json({ authenticated: false });
        res.cookies.set(cookieOpts.name, "", {
            httpOnly: cookieOpts.httpOnly,
            secure: cookieOpts.secure,
            sameSite: cookieOpts.sameSite,
            maxAge: 0,
            path: cookieOpts.path,
        });
        return res;
    } catch (err) {
        console.error("Logout error:", err);
        return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
    }
}

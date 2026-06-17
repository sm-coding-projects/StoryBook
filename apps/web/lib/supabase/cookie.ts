// @supabase/ssr derives the default auth cookie name from the Supabase URL's
// hostname. The browser and the server may use DIFFERENT Supabase URLs
// (e.g. localhost vs an internal docker hostname), which would produce
// mismatched cookie names and silently drop the session. Pin one name.
export const AUTH_COOKIE_NAME = 'sb-gallery-auth';

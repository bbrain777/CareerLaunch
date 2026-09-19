export function isPublicAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}

export function requiresLogin(
  pathname: string,
  token: string | null,
  loading: boolean
): boolean {
  return !loading && !token && !isPublicAuthPath(pathname);
}

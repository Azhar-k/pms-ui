import { redirect } from "react-router";
import { authAPI, tokenStorage } from "../../services/auth";

export async function action({ request }: { request: Request }) {
  // Call logout API to invalidate tokens on server
  await authAPI.logout();
  
  // Clear tokens from storage (client-side)
  tokenStorage.clear();
  
  // Create redirect response
  const response = redirect("/login", 302);
  
  // Clear cookies on server side by setting them with expired dates
  // Access token: NOT HttpOnly (to match how it's set in login)
  // Refresh token: HttpOnly (to match how it's set in login)
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', `auth_access_token=; Path=/; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  headers.append('Set-Cookie', `auth_refresh_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  headers.append('Set-Cookie', `auth_user=; Path=/; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}


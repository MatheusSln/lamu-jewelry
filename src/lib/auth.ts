export async function verifyAuth() {
  // TODO: Validate signed cookie from headers().get("cookie")
  // Return true if valid session, else false
  return true;
}

export async function createSession(userId: number) {
  // TODO: Generate signed JWT or session token, and set it via next/headers cookies()
}

export async function destroySession() {
  // TODO: Delete cookie
}

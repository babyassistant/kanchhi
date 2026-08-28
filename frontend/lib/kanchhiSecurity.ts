"use client";


// ============================================================
// KANCHHI SECURITY
// Phase 10 — Local-first authentication and session security.
//
// Important:
// - Passwords never leave the browser.
// - Password verifier is derived with Web Crypto PBKDF2.
// - Authentication data is stored locally.
// - Session token is stored only in sessionStorage.
// - This is browser-local authentication, not backend API auth.
// ============================================================


// ============================================================
// TYPES
// ============================================================

export type KanchhiAuthConfig = {
  version: 1;
  username: string;
  salt: string;
  verifier: string;
  iterations: number;
  createdAt: number;
  updatedAt: number;
  failedAttempts: number;
  lockedUntil: number | null;
};


export type KanchhiAuthSession = {
  token: string;
  username: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
};


export type KanchhiSecurityState = {
  accountConfigured: boolean;
  authenticated: boolean;
  username: string;
  createdAt: number | null;
  sessionCreatedAt: number | null;
  sessionExpiresAt: number | null;
  failedAttempts: number;
  lockedUntil: number | null;
};


// ============================================================
// CONSTANTS
// ============================================================

const AUTH_STORAGE_KEY =
  "kanchhi-security-auth";

const SESSION_STORAGE_KEY =
  "kanchhi-security-session";

const PBKDF2_ITERATIONS =
  210_000;

const SESSION_DURATION_MS =
  8 * 60 * 60 * 1000;

const MAX_FAILED_ATTEMPTS =
  5;

const LOCK_DURATION_MS =
  5 * 60 * 1000;

const MIN_PASSWORD_LENGTH =
  10;


// ============================================================
// BROWSER CHECK
// ============================================================

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof localStorage !== "undefined" &&
    typeof sessionStorage !== "undefined" &&
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined"
  );
}


// ============================================================
// RANDOM BYTES
// ============================================================

function createRandomBytes(
  length: number
): Uint8Array {

  const bytes =
    new Uint8Array(length);

  crypto.getRandomValues(
    bytes
  );

  return bytes;
}


// ============================================================
// BASE64
// ============================================================

function bytesToBase64(
  bytes: Uint8Array
): string {

  let binary = "";

  for (
    let index = 0;
    index < bytes.length;
    index += 1
  ) {

    binary += String.fromCharCode(
      bytes[index]
    );

  }

  return btoa(binary);
}


function base64ToBytes(
  value: string
): Uint8Array {

  const binary =
    atob(value);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {

    bytes[index] =
      binary.charCodeAt(index);

  }

  return bytes;
}


// ============================================================
// USERNAME
// ============================================================

function normalizeUsername(
  username: string
): string {

  return username
    .trim()
    .slice(0, 80);
}


// ============================================================
// PASSWORD VALIDATION
// ============================================================

function validatePassword(
  password: string
): void {

  if (
    password.length <
    MIN_PASSWORD_LENGTH
  ) {

    throw new Error(
      `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`
    );

  }

  if (
    !/[A-Z]/.test(password)
  ) {

    throw new Error(
      "Password must contain at least one uppercase letter."
    );

  }

  if (
    !/[a-z]/.test(password)
  ) {

    throw new Error(
      "Password must contain at least one lowercase letter."
    );

  }

  if (
    !/[0-9]/.test(password)
  ) {

    throw new Error(
      "Password must contain at least one number."
    );

  }
}


// ============================================================
// AUTH CONFIG
// ============================================================

function readAuthConfig():
  KanchhiAuthConfig | null {

  if (!isBrowser()) {
    return null;
  }

  try {

    const raw =
      localStorage.getItem(
        AUTH_STORAGE_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {

      return null;
    }

    if (
      parsed.version !== 1 ||
      typeof parsed.username !==
        "string" ||
      typeof parsed.salt !==
        "string" ||
      typeof parsed.verifier !==
        "string" ||
      typeof parsed.iterations !==
        "number" ||
      typeof parsed.createdAt !==
        "number" ||
      typeof parsed.updatedAt !==
        "number"
    ) {

      return null;
    }

    return parsed as KanchhiAuthConfig;

  } catch {

    return null;
  }
}


function saveAuthConfig(
  config: KanchhiAuthConfig
): void {

  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(config)
  );
}


// ============================================================
// PASSWORD DERIVATION
// ============================================================

async function derivePasswordVerifier(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<string> {

  if (!isBrowser()) {

    throw new Error(
      "Web Crypto is unavailable."
    );

  }

  const encoder =
    new TextEncoder();

  const passwordBytes =
    encoder.encode(password);


  const key =
    await crypto.subtle.importKey(
      "raw",
      passwordBytes,
      {
        name: "PBKDF2",
      },
      false,
      [
        "deriveBits",
      ]
    );


  const saltBuffer =
    salt.buffer.slice(
      salt.byteOffset,
      salt.byteOffset +
        salt.byteLength
    );


  const derivedBits =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations,
        hash: "SHA-256",
      },
      key,
      256
    );


  return bytesToBase64(
    new Uint8Array(
      derivedBits
    )
  );
}


// ============================================================
// CONSTANT-TIME COMPARISON
// ============================================================

function constantTimeStringEqual(
  left: string,
  right: string
): boolean {

  if (
    left.length !==
    right.length
  ) {

    return false;
  }

  let difference = 0;

  for (
    let index = 0;
    index < left.length;
    index += 1
  ) {

    difference |=
      left.charCodeAt(index) ^
      right.charCodeAt(index);

  }

  return difference === 0;
}


// ============================================================
// SESSION TOKEN
// ============================================================

function createSessionToken(): string {
  return bytesToBase64(
    createRandomBytes(32)
  );
}


// ============================================================
// SESSION STORAGE
// ============================================================

function readSession():
  KanchhiAuthSession | null {

  if (!isBrowser()) {
    return null;
  }

  try {

    const raw =
      sessionStorage.getItem(
        SESSION_STORAGE_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {

      return null;
    }

    if (
      typeof parsed.token !==
        "string" ||
      typeof parsed.username !==
        "string" ||
      typeof parsed.createdAt !==
        "number" ||
      typeof parsed.lastActivityAt !==
        "number" ||
      typeof parsed.expiresAt !==
        "number"
    ) {

      return null;
    }

    return parsed as KanchhiAuthSession;

  } catch {

    return null;
  }
}


function saveSession(
  session: KanchhiAuthSession
): void {

  if (!isBrowser()) {
    return;
  }

  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(session)
  );
}


// ============================================================
// PUBLIC: ACCOUNT EXISTS
// ============================================================

export function hasKanchhiAccount(): boolean {

  return Boolean(
    readAuthConfig()
  );
}


// ============================================================
// PUBLIC: LOGOUT
// ============================================================

export function logoutKanchhi(): void {

  if (!isBrowser()) {
    return;
  }

  try {

    sessionStorage.removeItem(
      SESSION_STORAGE_KEY
    );

  } catch {

    // Ignore storage errors.
  }
}


// ============================================================
// PUBLIC: CREATE ACCOUNT
// ============================================================

export async function createKanchhiAccount(
  username: string,
  password: string
): Promise<void> {

  if (!isBrowser()) {

    throw new Error(
      "Authentication requires a browser."
    );
  }


  if (hasKanchhiAccount()) {

    throw new Error(
      "A KANCHHI account is already configured."
    );
  }


  const normalizedUsername =
    normalizeUsername(username);


  if (
    normalizedUsername.length <
    2
  ) {

    throw new Error(
      "Username must contain at least 2 characters."
    );
  }


  validatePassword(
    password
  );


  const salt =
    createRandomBytes(16);


  const verifier =
    await derivePasswordVerifier(
      password,
      salt,
      PBKDF2_ITERATIONS
    );


  const now =
    Date.now();


  const config:
    KanchhiAuthConfig = {

    version: 1,

    username:
      normalizedUsername,

    salt:
      bytesToBase64(
        salt
      ),

    verifier,

    iterations:
      PBKDF2_ITERATIONS,

    createdAt:
      now,

    updatedAt:
      now,

    failedAttempts:
      0,

    lockedUntil:
      null,
  };


  saveAuthConfig(
    config
  );


  await loginKanchhi(
    normalizedUsername,
    password
  );
}


// ============================================================
// PUBLIC: LOGIN
// ============================================================

export async function loginKanchhi(
  username: string,
  password: string
): Promise<void> {

  if (!isBrowser()) {

    throw new Error(
      "Authentication requires a browser."
    );
  }


  const config =
    readAuthConfig();


  if (!config) {

    throw new Error(
      "No KANCHHI account has been configured."
    );
  }


  const normalizedUsername =
    normalizeUsername(
      username
    );


  if (
    normalizedUsername !==
    config.username
  ) {

    throw new Error(
      "Incorrect username or password."
    );
  }


  const now =
    Date.now();


  if (
    config.lockedUntil !== null &&
    config.lockedUntil > now
  ) {

    const remainingSeconds =
      Math.ceil(
        (
          config.lockedUntil -
          now
        ) / 1000
      );


    throw new Error(
      `Too many failed attempts. Try again in ${remainingSeconds}s.`
    );
  }


  const salt =
    base64ToBytes(
      config.salt
    );


  const verifier =
    await derivePasswordVerifier(
      password,
      salt,
      config.iterations
    );


  const valid =
    constantTimeStringEqual(
      verifier,
      config.verifier
    );


  if (!valid) {

    config.failedAttempts += 1;


    if (
      config.failedAttempts >=
      MAX_FAILED_ATTEMPTS
    ) {

      config.failedAttempts = 0;

      config.lockedUntil =
        now +
        LOCK_DURATION_MS;

    }


    config.updatedAt =
      now;


    saveAuthConfig(
      config
    );


    throw new Error(
      "Incorrect username or password."
    );
  }


  config.failedAttempts =
    0;

  config.lockedUntil =
    null;

  config.updatedAt =
    now;


  saveAuthConfig(
    config
  );


  const session:
    KanchhiAuthSession = {

    token:
      createSessionToken(),

    username:
      config.username,

    createdAt:
      now,

    lastActivityAt:
      now,

    expiresAt:
      now +
      SESSION_DURATION_MS,
  };


  saveSession(
    session
  );
}


// ============================================================
// PUBLIC: AUTHENTICATED?
// ============================================================

export function isKanchhiAuthenticated(): boolean {

  if (!isBrowser()) {
    return false;
  }


  const config =
    readAuthConfig();

  const session =
    readSession();


  if (
    !config ||
    !session
  ) {

    return false;
  }


  const now =
    Date.now();


  if (
    session.expiresAt <=
    now
  ) {

    logoutKanchhi();

    return false;
  }


  if (
    session.username !==
    config.username
  ) {

    logoutKanchhi();

    return false;
  }


  return true;
}


// ============================================================
// PUBLIC: SESSION ACTIVITY
// ============================================================

export function touchKanchhiSession(): void {

  if (!isBrowser()) {
    return;
  }


  const session =
    readSession();


  if (!session) {
    return;
  }


  const now =
    Date.now();


  if (
    session.expiresAt <=
    now
  ) {

    logoutKanchhi();

    return;
  }


  session.lastActivityAt =
    now;


  saveSession(
    session
  );
}


// ============================================================
// PUBLIC: CHANGE PASSWORD
// ============================================================

export async function changeKanchhiPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {

  if (
    !isKanchhiAuthenticated()
  ) {

    throw new Error(
      "You must be authenticated to change the password."
    );
  }


  validatePassword(
    newPassword
  );


  const config =
    readAuthConfig();


  if (!config) {

    throw new Error(
      "KANCHHI account configuration is missing."
    );
  }


  const currentSalt =
    base64ToBytes(
      config.salt
    );


  const currentVerifier =
    await derivePasswordVerifier(
      currentPassword,
      currentSalt,
      config.iterations
    );


  const valid =
    constantTimeStringEqual(
      currentVerifier,
      config.verifier
    );


  if (!valid) {

    throw new Error(
      "Current password is incorrect."
    );
  }


  const newSalt =
    createRandomBytes(16);


  const newVerifier =
    await derivePasswordVerifier(
      newPassword,
      newSalt,
      PBKDF2_ITERATIONS
    );


  const now =
    Date.now();


  config.salt =
    bytesToBase64(
      newSalt
    );

  config.verifier =
    newVerifier;

  config.iterations =
    PBKDF2_ITERATIONS;

  config.updatedAt =
    now;

  config.failedAttempts =
    0;

  config.lockedUntil =
    null;


  saveAuthConfig(
    config
  );


  // Renew the session with the new password.
  await loginKanchhi(
    config.username,
    newPassword
  );
}


// ============================================================
// PUBLIC: SECURITY STATE
// ============================================================

export function getKanchhiSecurityState():
  KanchhiSecurityState {

  const config =
    readAuthConfig();

  const session =
    readSession();

  const authenticated =
    isKanchhiAuthenticated();


  return {

    accountConfigured:
      Boolean(config),

    authenticated,

    username:
      config?.username ||
      "",

    createdAt:
      config?.createdAt ??
      null,

    sessionCreatedAt:
      session?.createdAt ??
      null,

    sessionExpiresAt:
      session?.expiresAt ??
      null,

    failedAttempts:
      config?.failedAttempts ??
      0,

    lockedUntil:
      config?.lockedUntil ??
      null,
  };
}


// ============================================================
// PUBLIC: DELETE LOCAL ACCOUNT
// ============================================================

export function deleteKanchhiAccount(): void {

  if (!isBrowser()) {
    return;
  }

  try {

    localStorage.removeItem(
      AUTH_STORAGE_KEY
    );

    sessionStorage.removeItem(
      SESSION_STORAGE_KEY
    );

  } catch {

    // Ignore storage errors.
  }
}


// ============================================================
// PUBLIC: PASSWORD REQUIREMENTS
// ============================================================

export function getKanchhiPasswordRequirements():
  string[] {

  return [

    `At least ${MIN_PASSWORD_LENGTH} characters`,

    "At least one uppercase letter",

    "At least one lowercase letter",

    "At least one number",

  ];
}
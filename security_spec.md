# Security Specification: PharmacoLogic Pro Secure Firestore Rules

## 1. Data Invariants

1. **User Ownership Rule**: A user can only read, write, update, or delete their own saved monographs and search history entries. Access to `/users/{userId}/savedMonographs/{monographId}` and `/users/{userId}/searchHistory/{historyId}` is strictly bounded by the condition `request.auth.uid == userId`.
2. **Identification Uniformity**: Any document or query must specify coordinates linking UID directly to the user's authentic credential. Setting `userId` or accessing a subcollection path representing another user ID is strictly prohibited.
3. **Immutability of Key Data**: Once saved, the primary coordinates like drug `rxcui` or `savedAt` / `searchedAt` timestamps are completely immutable. They must not undergo updates.
4. **Temporal Integrity**: All record creations must enforce server timestamps via `request.time`. Specifying client-generated dates in payloads is blocked.
5. **No Anonymous Exploits**: Unless authenticated with email verification, nobody has write access to save monographs.
6. **Limit Scaling Bounds**: To prevent database exhaustion, document IDs and field sizes must be strictly bounded (e.g., query size bounds, id character whitelist checks, size limits <= 100 characters).

---

## 2. The "Dirty Dozen" Attack Payloads

These 12 scenarios try to hijack, poison, or leak information within client interactions:

1. **The Identity Thief**: Attempting to read User B's saved monographs file as Authenticated User A.
   * *Target Path*: `/users/user_B/savedMonographs/monograph_1`
   * *Status*: `PERMISSION_DENIED`
2. **The History Snooper**: Attempting to query or read User B's search logs as User A.
   * *Target Path*: `/users/user_B/searchHistory/search_1`
   * *Status*: `PERMISSION_DENIED`
3. **The Shadow Hijacker**: Writing a saved monograph to User A's subcollection but trying to specify a mismatched ID payload or shadow fields.
   * *Payload*: `{ rxcui: "12345", drugName: "Lisinopril", hackerProperty: "admin_access_bypass_true" }`
   * *Status*: `PERMISSION_DENIED` (fails schema size match `/affectedKeys().hasOnly()`)
4. **The Ghost Writer**: Creating a saved monograph while pretending to be User A when unauthenticated.
   * *Payload*: `{ rxcui: "12345", drugName: "Lisinopril", savedAt: "2026-05-26T15:30:00Z" }`
   * *Status*: `PERMISSION_DENIED`
5. **The Time Accelerator**: Prescribing a client-controlled future timestamp instead of a server timestamp on a historical log entry.
   * *Payload*: `{ query: "Lipitor", searchedAt: timestamp("2030-01-01T00:00:00Z") }`
   * *Status*: `PERMISSION_DENIED`
6. **The Memory Overflower**: Injecting a extremely long string (1MB) as a search query to exhaust storage buffers.
   * *Payload*: `{ query: "A".repeat(1000000), searchedAt: request.time }`
   * *Status*: `PERMISSION_DENIED` (fails `.size() <= 200` constraint)
7. **The Poison ID**: Saving a monograph with a document ID filled with junk symbols or long overflow text.
   * *Target ID*: `monograph_$$$_!!!_POISON_STRING_OVER_128_CHARACTERS_...`
   * *Status*: `PERMISSION_DENIED`
8. **The Update Shuffler**: Trying to update an immutable `rxcui` to switch a saved drug record from "Aspirin" to "Fentanyl" retroactively.
   * *Action*: Update existing saved monograph changing `rxcui` from `"1191"` to `"4312"`
   * *Status*: `PERMISSION_DENIED`
9. **The Email Impersonator**: Trying to create records with a spoofed admin email assertion but setting `email_verified` to `false`.
   * *Auth Header*: `{ uid: "malicious_user", email: "admin@pharm.com", email_verified: false }`
   * *Status*: `PERMISSION_DENIED`
10. **The Blanket Scraper**: Querying the entire multi-user database of saved monographs without filtering for one's own `userId`.
    * *Query*: Select all saved monographs in system
    * *Status*: `PERMISSION_DENIED`
11. **The Null Identifier**: Creating a history log containing a blank query or whitespace.
    * *Payload*: `{ query: "   ", searchedAt: request.time }`
    * *Status*: `PERMISSION_DENIED`
12. **The Anonymous Spammer**: Creating search history items using an anonymous session without true identity binding.
    * *Auth Context*: Anonymous auth
    * *Status*: `PERMISSION_DENIED`

---

## 3. Test Runner Concept

Here is the declarative code representation verifying the Rules block boundaries:

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

describe("PharmacoLogic Security Rules", () => {
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "pharmaco-logic-app",
      firestore: {
        host: "localhost",
        port: 8080,
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it("denies unauthenticated saves", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const docRef = db.doc("users/user_A/savedMonographs/mono_1");
    await assertFails(docRef.set({ rxcui: "123", drugName: "Aspirin", savedAt: new Date() }));
  });

  it("prevents reading private user logs from other users", async () => {
    const context = testEnv.authenticatedContext("user_A");
    const db = context.firestore();
    const docRef = db.doc("users/user_B/savedMonographs/mono_1");
    await assertFails(docRef.get());
  });
});
```

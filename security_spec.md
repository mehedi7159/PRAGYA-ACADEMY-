# Security Specification for Progga Academy

## Data Invariants
1. Students, Payments, Expenses, and Attendance records MUST have a `userId` matching the authenticated user.
2. Users can only read/write documents that belong to them (`doc.userId == request.auth.uid`).
3. `id` and `studentId` fields must be valid strings.
4. Amounts must be non-negative numbers.
5. Dates must follow YYYY-MM-DD or be valid strings consistent with the app's usage.

## The Dirty Dozen Payloads (Rejection Tests)

1. **Identity Spoofing**: Create a student with a different `userId`.
```json
{ "id": "STU-001", "name": "Hack", "userId": "ATTACKER_ID", "status": "Active", "batch": "A" }
```
(Should fail because `userId` must match `request.auth.uid`)

2. **Cross-User Leak**: Try to read another user's student document.
(Rule: `allow get: if resource.data.userId == request.auth.uid`)

3. **Field Injection**: Add a hidden field `isAdmin: true` to a student record.
(Rule: validation helper `keys().size()`)

4. **Resource Poisoning**: Use a 1MB string for student name.
(Rule: `size() <= 100`)

5. **State Shortcut**: Try to update a payment amount without being the owner.
(Rule: `allow update: if resource.data.userId == request.auth.uid`)

6. **Negative Finance**: Create an expense with negative amount.
(Rule: `amount >= 0`)

7. **Orphaned Payment**: Create a payment for a student ID that doesn't exist (optional but good).
(Rule: `exists(/databases/$(database)/documents/students/$(incoming().studentId))`)

8. **Admin Privilege Escalation**: Update own settings to include admin flags (if they existed).
(Rule: `affectedKeys().hasOnly(...)`)

9. **Terminal State Bypass**: (Not applicable yet as there are no terminal states defined).

10. **Unprotected List Query**: Attempt to list ALL students without a where clause (if the rule didn't enforce it).
(Rule: `allow list: if resource.data.userId == request.auth.uid`)

11. **Spoofed Auth Email**: (Auth is Google-only, but rule should check `email_verified`).

12. **Malicious ID**: Use an ID like `../../../etc/passwd`.
(Rule: `isValidId(id)`)

## Test Runner (Draft)
(I will skip the full `.test.ts` for now as per usual workflow unless explicitly required to run it, but I'll implement the rules carefully.)

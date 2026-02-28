# Streak API Documentation

This document outlines the API response shape and a test case for the streak calculation endpoint.

## API Endpoint

`GET /api/streak/:userId`

### Success Response (200 OK)

The API returns a JSON object with the user's current streak information.

**Shape:**

```json
{
  "current_streak": 5,
  "last_active_date": "2026-03-15",
  "is_at_risk": false
}
```

**Field Descriptions:**

-   `current_streak` (integer): The number of consecutive days the user has logged at least one session, calculated based on their local timezone.
-   `last_active_date` (string, `YYYY-MM-DD`): The most recent calendar date the user logged a session, in their local timezone.
-   `is_at_risk` (boolean):
    -   `true`: The user has not logged a session "today" in their local timezone. The streak will break if they don't log a session by their local midnight.
    -   `false`: The user has already logged a session "today" in their local timezone. Their streak is safe for the day.

### Error Responses

-   **400 Bad Request**: If `userId` is not provided.
-   **404 Not Found**: If no session data is found for the user.
-   **500 Internal Server Error**: If there's a problem with the database query or the server.

---

## DST Transition Test Case

This test case demonstrates that the streak logic is correct when a user logs sessions across a Daylight Saving Time boundary.

-   **User**: Fictional user with `id = 'dst-test-user-1'`
-   **Timezone**: `America/New_York` (IANA name)

### DST Context for `America/New_York` in 2025:

-   **DST Ends**: Sunday, November 2, 2025, at 2:00 AM. Clocks are turned back 1 hour to 1:00 AM.
    -   This day is 25 hours long.

### User's Session Log (stored in UTC):

1.  **Session 1**: `2025-10-31 23:30:00Z` (Friday)
    -   `America/New_York` time: `2025-10-31 19:30:00 EDT` (UTC-4)
    -   Local Date: **October 31**

2.  **Session 2**: `2025-11-01 23:30:00Z` (Saturday)
    -   `America/New_York` time: `2025-11-01 19:30:00 EDT` (UTC-4)
    -   Local Date: **November 1**

3.  **Session 3**: `2025-11-02 05:30:00Z` (Sunday, *after* DST change)
    -   The UTC time `05:30Z` is chosen because `2025-11-02 01:30 EDT` happens twice.
    -   `America/New_York` time: `2025-11-02 00:30:00 EST` (UTC-5)
    -   Local Date: **November 2**

4.  **Session 4**: `2025-11-04 01:30:00Z` (Tuesday)
    -   `America/New_York` time: `2025-11-03 20:30:00 EST` (UTC-5)
    -   Local Date: **November 3**

### Streak Calculation

Let's assume "today" is **November 3, 2025, at 21:00 EST** in New York.

1.  The `calculate_streak` function is called for `dst-test-user-1`.
2.  It gets the user's timezone: `America/New_York`.
3.  It converts the UTC `created_at` timestamps to local dates:
    -   `2025-10-31`
    -   `2025-11-01`
    -   `2025-11-02`
    -   `2025-11-03`
4.  The distinct, ordered local dates are: `2025-11-03`, `2025-11-02`, `2025-11-01`, `2025-10-31`.
5.  The current local date is `2025-11-03`. The last session was on this date. The streak is not broken.
6.  The function iterates:
    -   Is `2025-11-03` the same as `today`? Yes. Streak = 1.
    -   Is `2025-11-02` the same as `today - 1 day`? Yes. Streak = 2.
    -   Is `2025-11-01` the same as `today - 2 days`? Yes. Streak = 3.
    -   Is `2025-10-31` the same as `today - 3 days`? Yes. Streak = 4.
    -   There are no more consecutive dates.
7.  The user logged a session "today" (`2025-11-03`), so `is_at_risk` is `false`.

### Expected API Response

```json
{
  "current_streak": 4,
  "last_active_date": "2025-11-03",
  "is_at_risk": false
}
```
This result correctly identifies the 4-day streak despite the DST clock change, proving the `AT TIME ZONE` logic is effective.

-- Function to calculate the current study streak for a user,
-- accounting for their local timezone and Daylight Saving Time (DST).

CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID)
RETURNS TABLE(current_streak INT, last_active_date DATE, is_at_risk BOOLEAN) AS $$
DECLARE
    user_timezone TEXT;
    today_local DATE;
    last_log_local_date DATE;
    streak INT := 0;
    is_active_today BOOLEAN := FALSE;
    days_diff INT;
    rec RECORD;
    i INT := 0;
BEGIN
    -- 1. Get the user's IANA timezone. Fallback to UTC if not set.
    SELECT timezone INTO user_timezone FROM public.users WHERE id = p_user_id;
    IF user_timezone IS NULL THEN
        user_timezone := 'UTC';
    END IF;

    -- 2. Determine the current date in the user's local timezone.
    today_local := (NOW() AT TIME ZONE user_timezone)::DATE;

    -- 3. Create a CTE to get distinct session dates in the user's local timezone.
    --    This is the core of the logic, converting each UTC timestamp to a local date.
    --    `DISTINCT` ensures we only count one session per day.
    --    We order them descending to check the most recent dates first.
    CREATE TEMP TABLE user_local_session_dates AS
    SELECT DISTINCT (created_at AT TIME ZONE user_timezone)::DATE AS local_date
    FROM public.sessions
    WHERE user_id = p_user_id
    ORDER BY local_date DESC;

    -- 4. Get the most recent session date.
    SELECT local_date INTO last_log_local_date FROM user_local_session_dates LIMIT 1;

    -- If there are no sessions, return 0 streak.
    IF last_log_local_date IS NULL THEN
        RETURN QUERY SELECT 0, NULL::DATE, TRUE;
        DROP TABLE user_local_session_dates;
        RETURN;
    END IF;

    -- 5. Check if the streak is broken.
    --    The difference in days between today and the last session.
    days_diff := today_local - last_log_local_date;

    -- If the last session was more than 1 day ago, the streak is 0.
    IF days_diff > 1 THEN
        RETURN QUERY SELECT 0, last_log_local_date, TRUE;
        DROP TABLE user_local_session_dates;
        RETURN;
    END IF;

    -- 6. Calculate the streak by iterating through the distinct, ordered session dates.
    FOR rec IN SELECT local_date FROM user_local_session_dates LOOP
        -- The expected next date in the streak sequence.
        -- For the first iteration (i=0), this is today_local or yesterday.
        IF (today_local - i) = rec.local_date THEN
            streak := streak + 1;
        ELSE
            -- The sequence is broken.
            EXIT;
        END IF;
        i := i + 1;
    END LOOP;

    -- 7. Determine the `is_at_risk` status.
    --    The user is at risk if they haven't logged a session "today" in their timezone.
    is_active_today := (last_log_local_date = today_local);

    -- The result includes the calculated streak, the last active date, and risk status.
    RETURN QUERY SELECT streak, last_log_local_date, NOT is_active_today;

    -- Clean up the temporary table.
    DROP TABLE user_local_session_dates;
END;
$$ LANGUAGE plpgsql;

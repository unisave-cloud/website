using System.Collections.Generic;

public class LeaderboardSnapshot
{
    /// <summary>
    /// Name of the leaderboard this snapshot represents.
    /// </summary>
    public string leaderboardName;

    /// <summary>
    /// Top 100 records of the leaderboard. May be less
    /// if the leaderboard has not grown enough yet.
    /// May be empty if the leaderboard is empty.
    /// </summary>
    public List<(string, float)> topRecords;
}

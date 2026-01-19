using System;
using System.Collections;
using System.Collections.Generic;
using Unisave;
using Unisave.Facets;
using Unisave.Facades;

public class LeaderboardFacet : Facet
{
    public LeaderboardResponse DownloadLeaderboard(
        string leaderboardName
    )
    {
        List<(string, float)> topRecords = DB.Query(@"
            FOR r IN leaderboardRecords
                FILTER r.leaderboardName == @leaderboardName
                SORT r.score DESC
                LIMIT @k
                RETURN [r.name, r.score]
        ")
            .Bind("leaderboardName", leaderboardName)
            .Bind("k", 100) // take top 100 records
            .GetAs<(string, float)>();
        
        return new LeaderboardSnapshot {
            leaderboardName = leaderboardName,
            topRecords = topRecords
        };
    }

    // 1-based leaderboard position
    private int EstimateScorePosition(
        string leaderboardName, float score
    )
    {
        return DB.Query(@"
            FOR r IN leaderboardRecords
                FILTER r.leaderboardName == @leaderboardName
                FILTER r.score > @score
                COLLECT WITH COUNT INTO length
                RETURN length
        ")
            .Bind("leaderboardName", leaderboardName)
            .Bind("score", score)
            .FirstAs<int>() + 1; // zero-index to one-index
    }

    public void SubmitScore(
        string leaderboardName, string playerName, float score
    )
    {
        var oldRecord = DB.TakeAll<LeaderboardRecordEntity>()
            .Filter(e => e.leaderboardName == leaderboardName)
            .Filter(e => e.playerName == playerName)
            .First();
        
        // insert a new record
        if (oldRecord == null)
        {
            var newRecord = new LeaderboardRecordEntity() {
                leaderboardName = leaderboardName,
                playerName = playerName,
                score = score
            };
            newRecord.Save();
            return;
        }

        // update the old record
        if (oldRecord.score < score)
        {
            oldRecord.score = score;
            oldRecord.Save();
        }
    }
}

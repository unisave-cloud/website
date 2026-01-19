using System;
using System.Collections;
using System.Collections.Generic;
using Unisave;
using Unisave.Entities;
using Unisave.Facades;

[EntityCollectionName("leaderboardRecords")]
public class LeaderboardRecordEntity : Entity
{
    /// <summary>
    /// Name of the leaderboard this record belongs to
    /// </summary>
    public string leaderboardName;

    /// <summary>
    /// Identifier of the player
    /// </summary>
    public string playerName;

    /// <summary>
    /// The score value
    /// </summary>
    public float score;
}
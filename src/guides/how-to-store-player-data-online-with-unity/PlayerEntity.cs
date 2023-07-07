using System;
using System.Collections.Generic;
using Unisave.Entities;

public class PlayerEntity : Entity
{
    public string playerToken;
    public int coins = 100;
    public SortedSet<string> achievements
        = new SortedSet<string>();
    public DateTime lastSeenAt = DateTime.UtcNow;
    public bool isBanned = false;
}

using System;
using Unisave.Facets;
using Unisave.Facades;

public class PlayerDataFacet : Facet
{
    public PlayerEntity GetPlayer(string playerToken)
    {
        PlayerEntity player = DB.TakeAll<PlayerEntity>()
            .Filter(e => e.playerToken == playerToken)
            .First();

        if (player == null) // no entity with this token
        {
            player = new PlayerEntity();
            player.playerToken = playerToken;
            player.Save(); // insert new document
        }

        player.lastSeenAt = DateTime.UtcNow;
        player.Save(); // update the existing document

        return player;
    }

    public void StorePlayer(
        string playerToken,
        PlayerEntity uploadedPlayer
    )
    {
        PlayerEntity playerFromDatabase = this.GetPlayer(playerToken);

        playerFromDatabase.coins = uploadedPlayer.coins;
        playerFromDatabase.achievements = uploadedPlayer.achievements;
        // we don't want the player to update
        // the "isBanned" and "lastSeenAt" fields

        playerFromDatabase.Save();
    }
}

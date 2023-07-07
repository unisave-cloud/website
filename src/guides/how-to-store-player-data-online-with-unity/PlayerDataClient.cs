using System;
using UnityEngine;
using Unisave.Facets;
using Unisave.Facades;
using Unisave.Serialization;

public class PlayerDataClient : MonoBehaviour
{
    public PlayerEntity player = null;

    void Start()
    {
        Debug.Log("Downloading player data...");

        OnFacet<PlayerDataFacet>
            .Call<PlayerEntity>(
                nameof(PlayerDataFacet.GetPlayer),
                PlayerToken.Get()
            )
            .Then(this.OnPlayerDownloaded)
            .Done();
    }

    void OnPlayerDownloaded(PlayerEntity downloadedPlayer)
    {
        this.player = downloadedPlayer;

        Debug.Log(
            "Player was downloaded: " +
            Serializer.ToJsonString(downloadedPlayer)
        );
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.A))
        {
            this.player.coins += 100;
            Debug.Log($"Player now has {this.player.coins} coins");
        }

        if (Input.GetKeyDown(KeyCode.S))
            this.SavePlayer();
    }

    void SavePlayer()
    {
        Debug.Log("Saving player data...");

        OnFacet<PlayerDataFacet>
            .Call(
                nameof(PlayerDataFacet.StorePlayer),
                PlayerToken.Get(),
                this.player
            )
            .Then(() =>
            {
                Debug.Log("Player data was saved.");
            })
            .Done();
    }

    void OnDisable()
    {
        this.SavePlayer();
    }
}

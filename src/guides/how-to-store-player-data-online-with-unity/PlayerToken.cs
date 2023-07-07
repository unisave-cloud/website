using UnityEngine;
using Unisave.Utils;

public static class PlayerToken
{
    private const string TokenKey = "auth.playerToken";

    public static string Get()
    {
        if (!PlayerPrefs.HasKey(TokenKey))
        {
            PlayerPrefs.SetString(TokenKey, Str.Random(32));
            PlayerPrefs.Save();
        }

        return PlayerPrefs.GetString(TokenKey);
    }
}

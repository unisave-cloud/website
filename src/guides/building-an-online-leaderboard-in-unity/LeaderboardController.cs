using System;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using Unisave.Facades;
using Unisave.Facets;
using Unisave;

public class LeaderboardController : MonoBehaviour
{
    // references to UI components,
    // must be set up manually in the inspector window
    public TextMeshProUGUI leftText;
    public TextMeshProUGUI rightText;
    public TMP_InputField nameField;
    public Button submitButton;

    // information about this level run
    private float currentScore;
    private string levelName;

    // state that controls the UI
    // (the snapshot is null while it's being downloaded)
    private LeaderboardSnapshot snapshot = null;
    private int? estimatedPosition = null;
    private bool scoreWasSubmitted = false;

    void Start()
    {
        submitButton.onClick.AddListener(SubmitScore);
    }

    // when the leaderboard dialog window is displayed
    async void OnEnable()
    {
        // dummy code,
        // pull the number from your score tracking script instead
        currentScore = UnityEngine.Random.Range(0.0f, 1000.0f);

        // dummy code,
        // pull this from your level naming system
        levelName = SceneManager.GetActiveScene().name;

        // reset the UI state and re-render
        snapshot = null;
        estimatedPosition = null;
        scoreWasSubmitted = false;
        Render();

        // download the leaderboard and re-render
        snapshot = await this.CallFacet(
            (LeaderboardFacet f) => f.DownloadSnapshot(
                levelName
            )
        );
        estimatedPosition = await this.CallFacet(
            (LeaderboardFacet f) => f.EstimatePosition(
                levelName,
                currentScore
            )
        );
        Render();
    }

    // when the submit button is clicked
    async void SubmitScore()
    {
        // forget the old snapshot and download the new one
        snapshot = null;
        scoreWasSubmitted = true;
        Render();

        // submit the score and download the new snapshot
        await this.CallFacet(
            (LeaderboardFacet f) => f.SubmitScore(
                levelName,
                nameField.text,
                currentScore
            )
        );
        snapshot = await this.CallFacet(
            (LeaderboardFacet f) => f.DownloadSnapshot(
                levelName
            )
        );
        Render();
    }

    ///////////////////////
    // UI Rendering code //
    ///////////////////////

    // Updates the UI based on the state
    void Render()
    {
        if (snapshot == null || estimatedPosition === null)
        {
            RenderLoading();
            RenderSubmitUI(isVisible: false);
        }
        else
        {
            RenderLeaderboard();
            RenderSubmitUI(isVisible: !scoreWasSubmitted);
        }
    }

    void RenderLoading()
    {
        leftText.text = "<b>Name</b>\n\nLoading leaderboard...";
        rightText.text = "<b>Score</b>";
    }

    void RenderLeaderboard()
    {
        // get a copy of the top 5 records
        // (the server sent us top 100 records, we only show top 5)
        List<(string, float)> renderedRecords = snapshot.topRecords
            .Take(5)
            .ToList();

        // if the leaderboard is too empty, add dummy records
        // to make sure our table always has 5 rows
        while (renderedRecords.Count < 5)
            renderedRecords.Add(("---", 0.0f));
        
        // render the table header
        leftText.text = "<b>Name</b>\n";
        rightText.text = "<b>Score</b>\n";

        // render table rows
        int i = 1;
        foreach ((string name, float score) in renderedRecords)
        {
            // 1. Alice       123
            // 2. Peter       123
            leftText.text += i + ". " + name + "\n";
            rightText.text += Mathf.RoundToInt(score) + "\n";
            
            i += 1;
        }

        // show the estimated position
        leftText.text += "\n" + estimatedPosition.Value + ". You";
        rightText.text += "\n" + Mathf.RoundToInt(currentScore) + "\n";
    }

    void RenderSubmitUI(bool isVisible)
    {
        nameField.gameObject.SetActive(isVisible);
        submitButton.gameObject.SetActive(isVisible);
    }
}

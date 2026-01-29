using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LightJson;
using Unisave;
using Unisave.Facets;
using Unisave.Facades;

public class NpcFacet : Facet
{
    private const string SystemPrompt =
        "You are a goblin trader. Today, you sold many magical and " +
        "prohibited items to various shady people. A few moments ago " +
        "you sold a dragon egg to a warlock in a black cape. You don't " +
        "know his name, you're just excited about the trade since you " +
        "made a lot of money. But you also know that selling dagon " +
        "eggs is prohibited and you will be fined much more than you " +
        "made if the king finds out. You are also a rude person, short " +
        "on words, so that others don't pay much attention to your " +
        "deeds. Now, a random villager is comming up to you. You " +
        "already greeted him: \"What you looking at?\". He wants to " +
        "know what have you sold to the warlock. Don't mention the egg " +
        "until he really pushes you on it. Be offensive to him. Keep " +
        "your answers short, about 2-3 sentences.";
    
    public async Task<NpcConversation> RespondToPlayer(
        NpcConversation conversation,
        string playerPrompt
    )
    {
        string openaiApiKey = Env.GetString("OPENAI_API_KEY");
        
        // build the OpenAI API request body JSON
        // https://platform.openai.com/docs/api-reference/responses/create
        var jsonRequest = new JsonObject
        {
            ["model"] = "gpt-5-nano",
            ["reasoning"] = new JsonObject {
                ["effort"] = "low"
            },
            ["instructions"] = SystemPrompt,
            ["input"] = playerPrompt,
            ["store"] = true
        };
        
        // continue an older conversation instead of starting a new one
        if (conversation.openapiPreviousResponseId != null)
            jsonRequest["previous_response_id"]
                = conversation.openapiPreviousResponseId;
        
        Log.Info("Sending: " + jsonRequest);
        
        // send an HTTP request to the OpenAI API
        var httpResponse = await Http
            .WithToken(openaiApiKey)
            .PostAsync(
                "https://api.openai.com/v1/responses",
                jsonRequest
            );
        
        Log.Info("Received: " + await httpResponse.BodyAsync());

        // Throw exception on unexpected HTTP status codes (4xx and 5xx)
        // Note: "401 Unauthorized" means the API Key is invalid
        httpResponse.Throw();

        // parse the response body as JSON object
        // https://platform.openai.com/docs/api-reference/responses/object
        JsonObject jsonResponse = await httpResponse.JsonAsync();
        if (jsonResponse == null)
            throw new Exception(
                "No response body returned from OpenAI API"
            );

        // filter out text outputs and for each,
        // take their "content" array and convert
        // its contents to strings
        string[] textParts = jsonResponse["output"].AsJsonArray
            .Where(item => item["type"] == "message")
            .SelectMany(item => item["content"].AsJsonArray
                .Select(m => m["type"] == "output_text"
                    ? m["text"].AsString
                    : m.ToString() // unknown content type
                )
            )
            .ToArray();

        // build new conversation description and send it to the client
        return new NpcConversation {
            openapiPreviousResponseId =  jsonResponse["id"].AsString,
            lastModelResponseText = string.Join("\n", textParts),
        };
    }
}
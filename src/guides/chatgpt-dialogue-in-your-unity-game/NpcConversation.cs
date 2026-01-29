public class NpcConversation
{
    /// <summary>
    /// The ID of the previous response from OpenAI from which
    /// we continue the conversation. Null if there has been
    /// no response by the model in this conversation yet.
    /// </summary>
    public string openapiPreviousResponseId = null;

    /// <summary>
    /// What is the latest new statement that the model returned.
    /// Null if the model has not yet said anything.
    /// </summary>
    public string lastModelResponseText = null;
}
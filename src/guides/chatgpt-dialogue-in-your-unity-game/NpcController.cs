using Unisave.Facets;
using UnityEngine;
using TMPro;
using Unisave;
using UnityEngine.UI;

public class NpcController : MonoBehaviour
{
    // references to UI components,
    // must be set up manually in the inspector window
    public TMP_InputField promptField;
    public Button respondButton;
    public TextMeshProUGUI conversationText;
    
    // conversation state necessary to generate coherent responses
    private NpcConversation conversation = new NpcConversation();
    
    void Start()
    {
        respondButton.onClick.AddListener(OnPlayerResponse);
        promptField.onSubmit.AddListener(_ => OnPlayerResponse());
    }

    async void OnPlayerResponse()
    {
        // there is no player prompt, do nothing
        if (promptField.text == "")
            return;
        
        // add the player response to the conversation log
        conversationText.text += "\n\nYOU: ";
        conversationText.text += promptField.text;
        
        // send the request to Unisave and then OpenAI
        UnisaveOperation<NpcConversation> facetCall = this.CallFacet(
            (NpcFacet f) => f.RespondToPlayer(
                conversation,
                promptField.text
            )
        );
        
        // disable UI while waiting for response
        promptField.text = "Speaking...";
        promptField.interactable = false;
        respondButton.interactable = false;
        
        // wait for the response
        conversation = await facetCall;

        // display the goblin response
        conversationText.text += "\n\nGOBLIN: ";
        conversationText.text += conversation.lastModelResponseText;
        
        // enable UI again
        promptField.text = "";
        promptField.interactable = true;
        respondButton.interactable = true;
    }
}
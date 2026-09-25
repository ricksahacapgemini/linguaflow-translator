# Teams messaging extension

The manifest now exposes a **Translate** command from the Teams compose box and command box. The command is registered against the app ID as its `botId`.

## Required Azure setup

The command needs a Microsoft Bot registration before Teams can call it:

1. Create an Azure Bot resource and use the existing app ID as its Microsoft App ID, or replace `botId` with the registered bot ID.
2. Set the bot messaging endpoint to an HTTPS URL ending in `/api/messages`.
3. Implement the query handler so it returns a translated result card. The user can then select the result and insert it into the Teams compose box.
4. Add the bot credentials to the server as environment variables. Never put the Microsoft app secret in the Teams manifest or frontend.
5. Rebuild and upload `linguaflow-teams-app.zip` after updating the endpoint and app ID.

The existing tab continues to work without the bot. The messaging extension is the Teams-native path for inserting a reviewed Spanish translation into a chat message.
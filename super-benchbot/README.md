# Super's BenchBot

BenchBot's first task is to ping the Variety role when he changes games away from Overwatch. Its process is:

- Get an updated OAuth token from Twitch (needed since the latest Twitch API update)
- Check the /streams API every 30 seconds for the live stream information
- Lookup the game information using a Twitch API proxy elsewhere on the server.
- If the stream's game has been changed (and it's not Overwatch, Just Chatting or similar):
-- Get the announcement channel
-- Edit the role so it can be pingable by anyone
-- Send a formatted message to the announcement channel using data from Twitch
-- Edit the role so no-one can ping it again


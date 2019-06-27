# Known Limitations when dealing with Messages through the Slack API

## Me Messages

> Me messages cannot be posted with a bot token in the name of another person.

_Reason:_ `chat.meMessage` does not support `username` and `icon_url` like `chat.postMessage`

_Workaround:_ Use `chat.postMessage` with text in italic

## Files

> Files cannot be uploaded & shared with a bot token in the name of another person.

_Reason:_ `files.upload` does not support `username` and `icon_url` like `chat.postMessage`

_Workaround:_ Add a hint of actual authorship to the file text.

> Files cannot be uploaded in batches and summarized in one file_shared message.

_Reason_: `files.upload` does only accept a single file stream as argument

_Workaround:_ Upload each file independently and live with multiple file_shared messages.

> Files cannot be updated.

_Reason_: There is simply no API endpoint for it.

_Workaround:_ Upload the file again, and delete the old file (will automatically remove old messages).

> The content of posts cannot be re-posted as is

_Reason:_ Posts are returned by the `file_private` and `file_private_donwload` url as JSON but
when uploading this JSON as both content or file, it just ends as text in the post. Posting
Markdown in the content field however creates a structured post.

_Workaround:_ Re-engineer the reverse JSON to Markdown transformation and post content as Markdown.

## Threads

> Thread broadcasts work with text messages but not with files.

_Reason:_ `files.upload` does not support `reply_broadcast` like `chat.postMessage`

_Workaround:_ Prepend a `@channel` mention to the `initial_comment` of the file to create awareness.
Can also just be ignored as a minor issue.

> When using reactions on replies, their parent message cannot be identified in a straightforward way.

_Reason:_ The `reaction_added` and `reaction_removed` events do not provide a field `thread_ts` like 
`message` events

_Workaround_: Search for the reply in messages of the `conversations.history` that are older than the reply

# Known API Limitations when dealing with Messages

## Me Messages

> Me messages cannot be posted with a third persons's user avatar and name

_Reason:_ `chat.meMessage` does not support `username` and `icon_url` like `chat.postMessage`

_Workaround:_ Use `chat.postMessage` with text in italic

## Files

> Files cannot be uploaded with a third persons's user avatar and name

_Reason:_ `files.upload` does not support `username` and `icon_url` like `chat.postMessage`

_Workaround:_ No known workaround

> Files cannot be uploaded in batches, multiple file creations will result in multiple messages.

_Reason_: `files.upload` does only accept a single file stream as argument

_Workaround:_ Upload each file independently

> The content of posts cannot just be reposted as is

_Reason:_ Posts are returned by the `file_private` and `file_private_donwload` url as JSON but
when uploading this JSON as both content or file, it just ends as text in the post. Posting
Markdown in the content field however creates a structured post.

_Workaround:_ Re-engineer the reverse JSON to Markdown transformation and post content as Markdown.

## Threads

> Thread broadcasts work with text messages but not with files

_Reason:_ `files.upload` does not support `reply_broadcast` like `chat.postMessage`

_Workaround:_ Prepend a `@channel` mention to the `initial_comment` of the file to create awareness.
Can probably also just be ignored as a minor issue.

> When using reactions on replies, their parent message cannot be identified in a straightforward way.

_Reason:_ The `reaction_added` and `reaction_removed` events do not provide a field `thread_ts` like 
`message` events

_Workaround_: Search for the reply in messages of the `conversations.history` that are older than the reply

# Known Limitations of sending Bot Messages

## Me Messages

> Me messages cannot be posted with a third persons's user avatar and name

_Reason:_ `chat.meMessage` does not support `username` and `icon_url` like `chat.postMessage`

_Workaround:_ Use `chat.postMessage` with text in italic

## Files

> Files cannot be posted with a third persons's user avatar and name (no API fields)

_Reason:_ `files.upload` does not support `username` and `icon_url` like `chat.postMessage`

_Workaround:_ No known workaround

> The content of posts cannot just be reposted as is

_Reason:_ Posts are returned by the `file_private` and `file_private_donwload` url as JSON but
when uploading this JSON as both content or file, it just ends as text in the post. Posting
Markdown in the content field however creates a structured post.

_Workaround:_ Re-engineer the reverse JSON to Markdown transformation and post content as Markdown.

## Threads

> Thread broadcasts work with text messages but not with files (no API field)

_Reason:_ `files.upload` does not support `reply_broadcast` like `chat.postMessage`

_Workaround:_ Prepend a `@channel` mention to the `initial_comment` of the file to create awareness.
Can probably also just be ignored as a minor issue.

export const IGNORED_MESSAGE_SUBTYPES = [
  'bot_message', 'pinned_item', 'unpinned_item', 'ekm_access_denied',
  'channel_archive', 'channel_join', 'channel_leave', 'channel_name', 'channel_purpose', 'channel_topic', 'channel_unarchive',
  'group_archive', 'group_join', 'group_leave', 'group_name', 'group_purpose', 'group_topic', 'group_unarchive'
]

export const SUPPORTED_MESSAGE_SUBTYPES = {
  file_share: 'file_share'
}

export const buildNotSupportedMessage = (type) => {
  return `:warning: Forwarding ${type} is not supported at this point.`
}

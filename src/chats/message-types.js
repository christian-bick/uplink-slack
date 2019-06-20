import _ from 'lodash'

/* eslint-disable camelcase */
const bot_message = 'bot_message'
const pinned_item = 'pinned_item'
const unpinned_item = 'unpinned_item'
const ekm_access_denied = 'ekm_access_denied'
const channel_archive = 'channel_archive'
const channel_join = 'channel_join'
const channel_leave = 'channel_leave'
const channel_name = 'channel_name'
const channel_purpose = 'channel_purpose'
const channel_topic = 'channel_topic'
const channel_unarchive = 'channel_unarchive'
const group_archive = 'group_archive'
const group_join = 'group_join'
const group_leave = 'group_leave'
const group_name = 'group_name'
const group_purpose = 'group_purpose'
const group_topic = 'group_topic'
const group_unarchive = 'group_unarchive'
const file_share = 'file_share'

export const MESSAGE_TYPES = {
  bot_message,
  ekm_access_denied,
  pinned_item, unpinned_item,
  channel_archive, channel_join, channel_leave, channel_name, channel_purpose, channel_topic, channel_unarchive,
  group_archive, group_join, group_leave, group_name, group_purpose, group_topic, group_unarchive,
  file_share
}

export const IGNORED_MESSAGE_SUBTYPES = _.pick(MESSAGE_TYPES, [
  bot_message,
  ekm_access_denied,
  pinned_item, unpinned_item,
  channel_archive, channel_join, channel_leave, channel_name, channel_purpose, channel_topic, channel_unarchive,
  group_archive, group_join, group_leave, group_name, group_purpose, group_topic, group_unarchive
])

export const SUPPORTED_MESSAGE_SUBTYPES = _.pick(MESSAGE_TYPES, [
  file_share
])

export const buildNotSupportedMessage = (type) => {
  return `:warning: Forwarding ${type} is not supported at this point.`
}

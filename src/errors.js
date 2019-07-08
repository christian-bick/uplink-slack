import { element, object, block, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'
import { supportLink } from './links'

const { text } = object
const { section, divider } = block
const { button } = element

export class BotError extends Error {
  constructor(reply, context) {
    super(reply)
    this.reply = reply
    this.context = context
  }

  static buildMessage(reply, context) {
    return {
      blocks: [
        section(
          text(':warning: *Something went wrong*', TEXT_FORMAT_MRKDWN)
        ),
        divider(),
        section(
          text(reply),
          {
            accessory: button('contact-support', 'Get Support', { url: supportLink(context) })
          }
        ),
        divider()
      ]
    }
  }

  generateMessage() {
    return BotError.buildMessage(this.reply, this.context)
  }
}

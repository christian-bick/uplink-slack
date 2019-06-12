export const reactToAppHomeOpened = ({ context, say, ack }) => {
  ack()
  say('Hi!')
}

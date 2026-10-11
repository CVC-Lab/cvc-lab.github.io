import * as React from 'react'

const subscribeToNothing = () => () => {}

/**
 * False while React hydrates the server HTML, true afterwards and whenever the component mounts
 * on the client (a link, Back or Forward). A component whose server HTML shows its default
 * state uses it to decide whether its first render may already show the state kept in the URL
 * or in history.state.
 */
export const useIsClientRender = () =>
  React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )

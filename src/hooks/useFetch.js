import { useCallback, useEffect, useState } from 'react'

// Runs an async function when deps change and tracks its three possible states:
// loading, error and data. reload() runs it again, for example after a delete.
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    // If deps change while a request is running, the old result must be ignored,
    // or a slow earlier search could overwrite the newer one.
    let active = true
    setState((previous) => ({ ...previous, loading: true, error: null }))

    fetcher()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }))

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((value) => value + 1), [])
  return { ...state, reload }
}

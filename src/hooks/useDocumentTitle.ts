import { useEffect } from 'react'

/** Updates document.title on mount. Format: "Page | ChangeOS" */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ChangeOS`
    return () => { document.title = 'ChangeOS' }
  }, [title])
}

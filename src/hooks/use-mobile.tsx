import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    console.log('useIsMobile: Initializing...')
    // Server-side rendering safe check
    if (typeof window === 'undefined') {
      console.log('useIsMobile: Window undefined, returning false')
      return false
    }
    try {
      const width = window.innerWidth
      const mobile = width < MOBILE_BREAKPOINT
      console.log(`useIsMobile init: width=${width}, mobile=${mobile}`)
      return mobile
    } catch (error) {
      console.error('useIsMobile init error:', error)
      return false
    }
  })

  React.useEffect(() => {
    console.log('useIsMobile: useEffect running')
    try {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
        try {
          const width = window.innerWidth
          const mobile = width < MOBILE_BREAKPOINT
          console.log(`useIsMobile onChange: width=${width}, mobile=${mobile}`)
          setIsMobile(mobile)
        } catch (error) {
          console.error('useIsMobile onChange error:', error)
        }
      }
      mql.addEventListener("change", onChange)
      
      // Initial check
      const width = window.innerWidth
      const mobile = width < MOBILE_BREAKPOINT
      console.log(`useIsMobile effect: width=${width}, mobile=${mobile}`)
      setIsMobile(mobile)
      
      return () => {
        try {
          mql.removeEventListener("change", onChange)
        } catch (error) {
          console.error('useIsMobile cleanup error:', error)
        }
      }
    } catch (error) {
      console.error('useIsMobile useEffect error:', error)
    }
  }, [])

  return isMobile
}

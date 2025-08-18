import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Server-side rendering safe check
    if (typeof window === 'undefined') return false
    const width = window.innerWidth
    const mobile = width < MOBILE_BREAKPOINT
    console.log(`useIsMobile init: width=${width}, mobile=${mobile}`)
    return mobile
  })

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const width = window.innerWidth
      const mobile = width < MOBILE_BREAKPOINT
      console.log(`useIsMobile onChange: width=${width}, mobile=${mobile}`)
      setIsMobile(mobile)
    }
    mql.addEventListener("change", onChange)
    
    // Initial check
    const width = window.innerWidth
    const mobile = width < MOBILE_BREAKPOINT
    console.log(`useIsMobile effect: width=${width}, mobile=${mobile}`)
    setIsMobile(mobile)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

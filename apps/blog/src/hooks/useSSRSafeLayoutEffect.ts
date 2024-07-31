import { useEffect, useLayoutEffect } from 'react'
import { isServer } from 'Utils/EnvironmentUtils'

export const useSSRSafeLayoutEffect = isServer() ? useEffect : useLayoutEffect

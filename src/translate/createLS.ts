import { createLSFactory } from "airport-js"
import type { Locales } from "./constant"

export const createLS = createLSFactory<Locales>()

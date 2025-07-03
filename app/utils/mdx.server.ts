import { compile } from "@mdx-js/mdx"
import { route } from "@react-router/dev/routes"
import glob from "fast-glob"
import { readFile } from "fs/promises"
import { resolve } from "path"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"
import * as v from "valibot"

const root = "content"

const AttributesSchema = v.object({
  title: v.string(),
  icon: v.optional(v.string()),
  description: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
})

const FrontmatterSchema = v.pipe(v.string(), v.parseJson(), AttributesSchema)
const LoadAllMdxAttributesSchema = v.array(
  v.object({
    slug: v.string(),
    ...AttributesSchema.entries,
  }),
)
const LoadMdxSchema = v.object({
  slug: v.string(),
  __raw: v.string(),
  attributes: AttributesSchema,
})

async function getMdxCode(folder: string, path: string) {
  return await compile(
    await readFile(resolve(process.cwd(), root, folder, `${path}.mdx`), {
      encoding: "utf-8",
    }),
    {
      outputFormat: "function-body",
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
    },
  ).then((result) => String(result))
}

function getAttributes(content: string) {
  const attributes =
    "{" + (content.match(/const frontmatter = \{([^}]+)\}/)?.[1] ?? "") + "}"
  return v.parse(FrontmatterSchema, attributes)
}

function getSlugFromPath(folder: string, path: string) {
  return path
    .replace(`${process.cwd()}/${root}/${folder}/`, "")
    .replace(/\.mdx$/, "")
}

export async function loadMdx(folder: string, path: string) {
  const __raw = await getMdxCode(folder, path)
  return v.parse(LoadMdxSchema, {
    slug: getSlugFromPath(folder, path),
    __raw,
    attributes: getAttributes(__raw),
  })
}

export async function loadAllMdxAttributes(folder: string) {
  const paths = await glob(resolve(process.cwd(), root, folder, "**", "*.mdx"))
  return v.parseAsync(
    LoadAllMdxAttributesSchema,
    await Promise.all(
      paths.map(async (_path) => {
        const path = _path.replace(/\.mdx$/, "")
        const attributes = getAttributes(await getMdxCode(folder, path))
        return {
          ...attributes,
          slug: getSlugFromPath(folder, path),
        }
      }),
    ),
  )
}

export async function loadAllMdx(folder: string) {
  const paths = await glob(resolve(process.cwd(), root, folder, "**", "*.mdx"))
  return v.parseAsync(
    v.array(LoadMdxSchema),
    await Promise.all(
      paths.map(async (_path) => {
        const path = _path.replace(/\.mdx$/, "")
        return loadMdx(folder, path)
      }),
    ),
  )
}

export function mdxRoutes(folder: string, componentPath: string) {
  const paths = glob.globSync(
    resolve(process.cwd(), root, folder, "**", "*.mdx"),
  )
  return paths.map((file) => {
    const path = getSlugFromPath(folder, file)
    return route(path, componentPath, {
      id: path,
    })
  })
}

import nextra from "nextra";

const withNextra = nextra({
  theme: "Themes/index.ts",
  readingTime: true,
});

export default withNextra({
  reactStrictMode: true,
  cleanDistDir: true,
});

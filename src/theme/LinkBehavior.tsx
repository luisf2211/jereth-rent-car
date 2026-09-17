"use client";

import * as React from "react";
import NextLink from "next/link";
import type { LinkProps as NextLinkProps } from "next/link";

/**
 * Adapter that lets MUI components use Next.js client-side navigation.
 *
 * Wired into the theme as the default `LinkComponent` for MuiButtonBase and
 * MuiLink. This keeps the `NextLink` function reference inside a client
 * module, so Server Components only pass a plain `href` string to MUI
 * components (avoiding "functions cannot be passed to Client Components").
 */
const LinkBehavior = React.forwardRef<
  HTMLAnchorElement,
  Omit<NextLinkProps, "href"> & { href?: NextLinkProps["href"] }
>(function LinkBehavior(props, ref) {
  const { href = "", ...other } = props;
  return <NextLink ref={ref} href={href} {...other} />;
});

export default LinkBehavior;

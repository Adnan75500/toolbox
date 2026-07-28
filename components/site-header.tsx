"use client"

import Link from "next/link"
import { Menu, ShieldCheck } from "lucide-react"
import { CATEGORIES } from "@/lib/tools"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="text-lg">ToolBox</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {CATEGORIES.slice(0, 6).map((cat) => (
            <Button
              key={cat.slug}
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={`/category/${cat.slug}`} />}
            >
              {cat.name}
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
              More
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {CATEGORIES.slice(6).map((cat) => (
                <DropdownMenuItem key={cat.slug} render={<Link href={`/category/${cat.slug}`} />}>
                  {cat.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem render={<Link href="/about" />}>About</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" aria-label="Open menu" />}
              >
                <Menu className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {CATEGORIES.map((cat) => (
                  <DropdownMenuItem key={cat.slug} render={<Link href={`/category/${cat.slug}`} />}>
                    {cat.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem render={<Link href="/about" />}>About</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group z-[70]"
      position="top-center"
      richColors
      closeButton
      expand
      visibleToasts={4}
      offset={20}
      mobileOffset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:w-[min(92vw,460px)] group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:bg-background/95 group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur supports-[backdrop-filter]:group-[.toaster]:bg-background/85",
          title: "text-sm font-semibold leading-5",
          description: "text-sm leading-5 text-muted-foreground group-data-[type=success]:text-emerald-900/80 group-data-[type=error]:text-red-900/80 dark:group-data-[type=success]:text-emerald-100/85 dark:group-data-[type=error]:text-red-100/85",
          success: "shadow-emerald-500/10",
          error: "shadow-red-500/10",
          info: "shadow-sky-500/10",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "group-data-[type=success]:border-emerald-200/80 group-data-[type=success]:text-emerald-700 group-data-[type=error]:border-red-200/80 group-data-[type=error]:text-red-700 dark:group-data-[type=success]:border-emerald-900 dark:group-data-[type=success]:text-emerald-200 dark:group-data-[type=error]:border-red-900 dark:group-data-[type=error]:text-red-200",
        },
      }}
      {...props} />
  );
}

export { Toaster }

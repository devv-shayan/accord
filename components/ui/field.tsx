"use client"

import * as React from "react"
import { cn } from "cn"

import { Label } from "@/components/ui/label"

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("cn-field-group group/field-group @container/field-group flex w-full flex-col", className)}
      {...props}
    />
  )
}

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation="vertical"
      className={cn("cn-field group/field flex w-full flex-col *:w-full [&>.sr-only]:w-auto", className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("cn-field-label group/field-label peer/field-label flex w-fit", className)}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("cn-field-description leading-normal font-normal text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Field, FieldDescription, FieldGroup, FieldLabel }

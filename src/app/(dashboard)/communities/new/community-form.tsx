"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { type CreateCommunityState, createCommunityAction } from "./actions";

const initialState: CreateCommunityState = {};

export function CommunityForm() {
  const [state, formAction, isPending] = useActionState(createCommunityAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Community</CardTitle>
        <CardDescription>Start a new community for your members</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="My Awesome Community"
              minLength={3}
              maxLength={100}
              required
            />
            {state.fieldErrors?.["name"] && (
              <p className="text-sm text-destructive">{state.fieldErrors["name"][0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              name="slug"
              placeholder="my-awesome-community"
              pattern="[a-z0-9-]+"
              minLength={3}
              maxLength={50}
            />
            {state.fieldErrors?.["slug"] && (
              <p className="text-sm text-destructive">{state.fieldErrors["slug"][0]}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate from name. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What is your community about?"
              maxLength={500}
              rows={3}
            />
            {state.fieldErrors?.["description"] && (
              <p className="text-sm text-destructive">{state.fieldErrors["description"][0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="visibility">Visibility</Label>
            <select
              id="visibility"
              name="visibility"
              defaultValue="public"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="public">Public - Anyone can see and join</option>
              <option value="private">Private - Invite only</option>
              <option value="paid">Paid - Requires payment to join</option>
            </select>
            {state.fieldErrors?.["visibility"] && (
              <p className="text-sm text-destructive">{state.fieldErrors["visibility"][0]}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Community"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

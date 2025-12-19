import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { deleteProject, getProject, UpdateProjectSchema, updateProject } from "@/features/projects";

const logger = getLogger("api.projects");

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]
 * Get a single project by ID.
 * Returns public projects to anyone, private projects only to owner.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    logger.info({ projectId: id, userId: user?.id ?? null }, "project.get_started");

    const project = await getProject(id, user?.id ?? null);

    logger.info({ projectId: id }, "project.get_completed");

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project. Only the owner can update.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const input = UpdateProjectSchema.parse(body);

    logger.info({ projectId: id, userId: user.id }, "project.update_started");

    const project = await updateProject(id, input, user.id);

    logger.info({ projectId: id, userId: user.id }, "project.update_completed");

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project. Only the owner can delete.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    logger.info({ projectId: id, userId: user.id }, "project.delete_started");

    await deleteProject(id, user.id);

    logger.info({ projectId: id, userId: user.id }, "project.delete_completed");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}

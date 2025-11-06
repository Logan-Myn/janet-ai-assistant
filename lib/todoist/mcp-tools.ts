// @ts-nocheck - Tool typing issues with AI SDK v5
import { z } from 'zod';
import { tool } from 'ai';
import { todoistClient } from './client';

/**
 * MCP Tools for Todoist Integration
 * These tools allow Claude AI to interact with Todoist during Extended Thinking
 */

export const todoistTools = {
  getTasks: tool({
    description: 'Get tasks from Todoist. Use this to check existing tasks, find conflicts, or understand the current workload. You can filter by project, labels, or due date.',
    parameters: z.object({
      projectId: z.string().optional().describe('Filter tasks by project ID'),
      labelId: z.string().optional().describe('Filter tasks by label ID'),
      dueDate: z.string().optional().describe('Filter tasks by due date (e.g., "today", "tomorrow", "2025-11-05")'),
    }),
    execute: async (args) => {
      try {
        const tasks = await todoistClient.getTasks({
          projectId: args.projectId,
          labelId: args.labelId,
          dueDate: args.dueDate,
        });
        return {
          success: true,
          tasks,
          count: tasks.length,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to fetch tasks from Todoist',
        };
      }
    },
  }),

  getTask: tool({
    description: 'Get a specific task by ID from Todoist. Use this to check task details, status, or dependencies.',
    parameters: z.object({
      taskId: z.string().describe('The ID of the task to retrieve'),
    }),
    execute: async (args) => {
      try {
        const task = await todoistClient.getTask(args.taskId);
        return {
          success: true,
          task,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to fetch task from Todoist',
        };
      }
    },
  }),

  createTask: tool({
    description: 'Create a new task in Todoist. Use this after analyzing conflicts and getting user confirmation. Always check for conflicts before creating tasks.',
    parameters: z.object({
      content: z.string().describe('The task content/title'),
      description: z.string().optional().describe('Detailed description of the task'),
      projectId: z.string().optional().describe('The project ID to add the task to'),
      dueDate: z.string().optional().describe('Due date in natural language (e.g., "tomorrow at 2pm", "next monday")'),
      priority: z.enum(['1', '2', '3', '4']).optional().describe('Priority: 1=normal, 2=medium, 3=high, 4=urgent'),
      labels: z.array(z.string()).optional().describe('Array of label names'),
      parentId: z.string().optional().describe('Parent task ID if this is a subtask'),
    }),
    execute: async (args) => {
      try {
        const task = await todoistClient.createTask({
          content: args.content,
          description: args.description,
          projectId: args.projectId,
          dueDate: args.dueDate,
          priority: args.priority ? parseInt(args.priority) as 1 | 2 | 3 | 4 : undefined,
          labels: args.labels,
          parentId: args.parentId,
        });
        return {
          success: true,
          task,
          message: `Task "${args.content}" created successfully`,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to create task in Todoist',
        };
      }
    },
  }),

  updateTask: tool({
    description: 'Update an existing task in Todoist. Use this to modify task details, change due dates, or update priorities.',
    parameters: z.object({
      taskId: z.string().describe('The ID of the task to update'),
      content: z.string().optional().describe('New task content/title'),
      description: z.string().optional().describe('New task description'),
      dueDate: z.string().optional().describe('New due date in natural language'),
      priority: z.enum(['1', '2', '3', '4']).optional().describe('New priority: 1=normal, 2=medium, 3=high, 4=urgent'),
      labels: z.array(z.string()).optional().describe('New array of label names'),
    }),
    execute: async (args) => {
      try {
        const task = await todoistClient.updateTask(args.taskId, {
          content: args.content,
          description: args.description,
          dueDate: args.dueDate,
          priority: args.priority ? parseInt(args.priority) as 1 | 2 | 3 | 4 : undefined,
          labels: args.labels,
        });
        return {
          success: true,
          task,
          message: `Task updated successfully`,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to update task in Todoist',
        };
      }
    },
  }),

  closeTask: tool({
    description: 'Mark a task as complete in Todoist. Use this when the user says they completed a task.',
    parameters: z.object({
      taskId: z.string().describe('The ID of the task to complete'),
    }),
    execute: async (args) => {
      try {
        await todoistClient.closeTask(args.taskId);
        return {
          success: true,
          message: 'Task marked as complete',
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to complete task in Todoist',
        };
      }
    },
  }),

  getProjects: tool({
    description: 'Get all projects from Todoist. Use this to understand project structure or find project IDs.',
    parameters: z.object({}),
    execute: async () => {
      try {
        const projects = await todoistClient.getProjects();
        return {
          success: true,
          projects,
          count: projects.length,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to fetch projects from Todoist',
        };
      }
    },
  }),

  createProject: tool({
    description: 'Create a new project in Todoist. Use this when the user wants to organize tasks into a new project.',
    parameters: z.object({
      name: z.string().describe('The project name'),
      color: z.string().optional().describe('Project color (e.g., "red", "blue", "green")'),
    }),
    execute: async (args) => {
      try {
        const project = await todoistClient.createProject(args.name, args.color);
        return {
          success: true,
          project,
          message: `Project "${args.name}" created successfully`,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to create project in Todoist',
        };
      }
    },
  }),

  analyzeTaskConflicts: tool({
    description: 'Analyze potential conflicts for a proposed task. Use this BEFORE creating tasks to detect time overlaps, dependencies, or workload issues. This is crucial for Extended Thinking.',
    parameters: z.object({
      taskContent: z.string().describe('The proposed task content'),
      dueDate: z.string().optional().describe('The proposed due date'),
      projectId: z.string().optional().describe('The project ID for the task'),
      estimatedDuration: z.number().optional().describe('Estimated task duration in minutes'),
    }),
    execute: async (args) => {
      try {
        // Get existing tasks to analyze conflicts
        const existingTasks = await todoistClient.getTasks({});

        const conflicts = await todoistClient.detectConflicts(
          {
            content: args.taskContent,
            dueDate: args.dueDate,
            projectId: args.projectId,
            estimatedDuration: args.estimatedDuration,
          },
          existingTasks
        );

        return {
          success: true,
          hasConflicts: conflicts.length > 0,
          conflicts,
          recommendation: conflicts.length > 0
            ? 'Conflicts detected. Consider asking the user how they want to proceed.'
            : 'No conflicts detected. Safe to create the task.',
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to analyze task conflicts',
        };
      }
    },
  }),
};

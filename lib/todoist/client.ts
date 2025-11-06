import { TodoistApi } from '@doist/todoist-api-typescript';
import { config } from '@/config';
import type { TodoistTask, TodoistProject, TaskConflict } from '@/types';
import { isAfter, isBefore, parseISO, addHours } from 'date-fns';

export class TodoistClient {
  private _api?: TodoistApi;

  private get api(): TodoistApi {
    if (!this._api) {
      this._api = new TodoistApi(config.todoist.apiToken);
    }
    return this._api;
  }

  async getTasks(filter?: {
    projectId?: string;
    labelId?: string;
    dueDate?: string;
  }): Promise<any[]> {
    try {
      const tasks = await this.api.getTasks(filter);
      return tasks as unknown as any[];
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw new Error('Failed to get tasks from Todoist');
    }
  }

  async getTask(taskId: string): Promise<any> {
    try {
      const task = await this.api.getTask(taskId);
      return task as any;
    } catch (error) {
      console.error('Error getting task:', error);
      throw new Error('Failed to get task from Todoist');
    }
  }

  async createTask(taskData: {
    content: string;
    description?: string;
    projectId?: string;
    dueDate?: string;
    priority?: 1 | 2 | 3 | 4;
    labels?: string[];
    parentId?: string;
  }): Promise<any> {
    try {
      const task = await this.api.addTask({
        content: taskData.content,
        description: taskData.description,
        projectId: taskData.projectId,
        dueString: taskData.dueDate,
        priority: taskData.priority,
        labels: taskData.labels,
        parentId: taskData.parentId,
      });
      return task as any;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task in Todoist');
    }
  }

  async updateTask(
    taskId: string,
    updates: {
      content?: string;
      description?: string;
      dueDate?: string;
      priority?: 1 | 2 | 3 | 4;
      labels?: string[];
    }
  ): Promise<any> {
    try {
      const task = await this.api.updateTask(taskId, {
        content: updates.content,
        description: updates.description,
        dueString: updates.dueDate,
        priority: updates.priority,
        labels: updates.labels,
      });
      return task as any;
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task in Todoist');
    }
  }

  async closeTask(taskId: string): Promise<boolean> {
    try {
      const success = await this.api.closeTask(taskId);
      return success;
    } catch (error) {
      console.error('Error closing task:', error);
      throw new Error('Failed to close task in Todoist');
    }
  }

  async getProjects(): Promise<any[]> {
    try {
      const projects = await this.api.getProjects();
      return projects as unknown as any[];
    } catch (error) {
      console.error('Error getting projects:', error);
      throw new Error('Failed to get projects from Todoist');
    }
  }

  async createProject(name: string, color?: string): Promise<any> {
    try {
      const project = await this.api.addProject({
        name,
        color,
      });
      return project as any;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project in Todoist');
    }
  }

  async detectConflicts(
    proposedTask: {
      content: string;
      dueDate?: string;
      projectId?: string;
      estimatedDuration?: number; // in minutes
    },
    existingTasks: TodoistTask[]
  ): Promise<TaskConflict[]> {
    const conflicts: TaskConflict[] = [];

    if (!proposedTask.dueDate) {
      return conflicts;
    }

    const proposedDate = parseISO(proposedTask.dueDate);
    const estimatedDuration = proposedTask.estimatedDuration || 60; // Default 1 hour

    const tasksOnSameDay = existingTasks.filter((task) => {
      if (!task.due?.datetime) return false;
      const taskDate = parseISO(task.due.datetime);
      return taskDate.toDateString() === proposedDate.toDateString();
    });

    if (tasksOnSameDay.length >= 8) {
      conflicts.push({
        type: 'workload',
        severity: 'high',
        message: `You already have ${tasksOnSameDay.length} tasks scheduled for this day, which may be overwhelming.`,
        conflictingTasks: tasksOnSameDay,
        suggestions: [
          'Consider spreading tasks across multiple days',
          'Review priorities and defer lower-priority tasks',
          'Combine similar tasks to reduce context switching',
        ],
      });
    }

    for (const existingTask of tasksOnSameDay) {
      if (!existingTask.due?.datetime) continue;

      const existingDate = parseISO(existingTask.due.datetime);
      const proposedEnd = addHours(proposedDate, estimatedDuration / 60);
      const existingEnd = addHours(existingDate, 1); // Assume 1 hour default

      const hasTimeOverlap =
        (isAfter(proposedDate, existingDate) && isBefore(proposedDate, existingEnd)) ||
        (isAfter(existingDate, proposedDate) && isBefore(existingDate, proposedEnd)) ||
        proposedDate.getTime() === existingDate.getTime();

      if (hasTimeOverlap) {
        conflicts.push({
          type: 'time_overlap',
          severity: 'high',
          message: `Time overlap detected with task: "${existingTask.content}"`,
          conflictingTasks: [existingTask],
          suggestions: [
            `Schedule the new task before ${existingDate.toLocaleTimeString()}`,
            `Schedule the new task after ${existingEnd.toLocaleTimeString()}`,
            'Move one of the tasks to a different day',
          ],
        });
      }
    }

    const projectTasks = existingTasks.filter(
      (task) => task.project_id === proposedTask.projectId && !task.is_completed
    );

    if (projectTasks.length > 0) {
      const incompleteDependencies = projectTasks.filter((task) =>
        this.isLikelyDependency(task.content, proposedTask.content)
      );

      if (incompleteDependencies.length > 0) {
        conflicts.push({
          type: 'dependency',
          severity: 'medium',
          message: 'Potential task dependencies detected',
          conflictingTasks: incompleteDependencies,
          suggestions: [
            'Complete prerequisite tasks first',
            'Create a parent-child task relationship',
            'Adjust task order in the project',
          ],
        });
      }
    }

    return conflicts;
  }

  private isLikelyDependency(existingTaskName: string, newTaskName: string): boolean {
    const dependencyKeywords = [
      ['create', 'send'],
      ['prepare', 'submit'],
      ['draft', 'finalize'],
      ['book', 'confirm'],
      ['research', 'implement'],
      ['design', 'build'],
    ];

    const existingLower = existingTaskName.toLowerCase();
    const newLower = newTaskName.toLowerCase();

    for (const [prerequisite, dependent] of dependencyKeywords) {
      if (existingLower.includes(prerequisite) && newLower.includes(dependent)) {
        return true;
      }
    }

    return false;
  }

  async getTasksForDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<TodoistTask[]> {
    const allTasks = await this.getTasks();

    return allTasks.filter((task) => {
      if (!task.due?.datetime && !task.due?.date) return false;

      const taskDate = task.due.datetime
        ? parseISO(task.due.datetime)
        : parseISO(task.due.date);

      return isAfter(taskDate, startDate) && isBefore(taskDate, endDate);
    });
  }
}

export const todoistClient = new TodoistClient();

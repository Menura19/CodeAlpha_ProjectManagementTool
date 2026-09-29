const request = require('supertest');
const app = require('../app');
const { setupTestDB } = require('./setup');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Project = require('../models/Project');

setupTestDB();

describe('Projects, Tasks, Members & Comments Endpoints', () => {
  let userACookies;
  let userA;
  let userBCookies;
  let userB;
  let userCCookies;
  let userC;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    userACookies = resA.headers['set-cookie'];
    userA = resA.body.user;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      fullName: 'Bob Smith',
      email: 'bob@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    userBCookies = resB.headers['set-cookie'];
    userB = resB.body.user;

    // Register User C (unrelated third-party)
    const resC = await request(app).post('/api/auth/register').send({
      fullName: 'Charlie Davis',
      email: 'charlie@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    userCCookies = resC.headers['set-cookie'];
    userC = resC.body.user;
  });

  it('should allow User A to create a project, making User A owner and members empty', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({
        name: 'Website Redesign Project',
        description: 'Complete overhaul of web assets',
        dueDate: '2026-10-31',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.project.name).toBe('Website Redesign Project');
    expect(res.body.project.owner._id).toBe(userA._id);
    expect(res.body.project.members.length).toBe(0);
  });

  it('should allow Owner to add User B by registered email', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({ name: 'Alpha Project' });
    const projectId = projRes.body.project._id;

    const addRes = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Cookie', userACookies)
      .send({ email: 'bob@example.com' });

    expect(addRes.statusCode).toBe(200);
    expect(addRes.body.success).toBe(true);

    // Verify Bob can now access Alpha Project
    const getRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Cookie', userBCookies);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.project.name).toBe('Alpha Project');
  });

  it('should reject adding non-existent email or duplicate member', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({ name: 'Beta Project' });
    const projectId = projRes.body.project._id;

    // Non-existent user
    const notFoundRes = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Cookie', userACookies)
      .send({ email: 'ghost@example.com' });
    expect(notFoundRes.statusCode).toBe(404);

    // Add Bob
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Cookie', userACookies)
      .send({ email: 'bob@example.com' });

    // Try adding Bob again
    const dupRes = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Cookie', userACookies)
      .send({ email: 'bob@example.com' });
    expect(dupRes.statusCode).toBe(400);
    expect(dupRes.body.message).toMatch(/already a member/i);

    // Try adding owner
    const ownerRes = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Cookie', userACookies)
      .send({ email: 'alice@example.com' });
    expect(ownerRes.statusCode).toBe(400);
    expect(ownerRes.body.message).toMatch(/already the owner/i);
  });

  it('should prevent non-owner (User B) from editing, deleting, or managing members', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({ name: 'Protected Project' });
    const projectId = projRes.body.project._id;

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Cookie', userACookies)
      .send({ email: 'bob@example.com' });

    // User B tries to update project name
    const editRes = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Cookie', userBCookies)
      .send({ name: 'Hacked Project Name' });
    expect(editRes.statusCode).toBe(403);

    // User B tries to delete project
    const delRes = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Cookie', userBCookies);
    expect(delRes.statusCode).toBe(403);

    // User B tries to add Charlie
    const addMemberRes = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Cookie', userBCookies)
      .send({ email: 'charlie@example.com' });
    expect(addMemberRes.statusCode).toBe(403);
  });

  it('should prevent unrelated User C from accessing project details or tasks', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({ name: 'Secret Project' });
    const projectId = projRes.body.project._id;

    const accessRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Cookie', userCCookies);
    expect(accessRes.statusCode).toBe(403);

    const tasksRes = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userCCookies);
    expect(tasksRes.statusCode).toBe(403);
  });

  it('should enforce exact status and priority enums on task creation', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({ name: 'Task Enum Project' });
    const projectId = projRes.body.project._id;

    // Invalid status
    const badStatusRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userACookies)
      .send({
        title: 'Bad status task',
        status: 'in_backlog', // Invalid!
        priority: 'high',
      });
    expect(badStatusRes.statusCode).toBe(400);

    // Invalid priority (e.g., Urgent)
    const badPriorityRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userACookies)
      .send({
        title: 'Bad priority task',
        status: 'todo',
        priority: 'Urgent', // Invalid!
      });
    expect(badPriorityRes.statusCode).toBe(400);

    // Valid task
    const validRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userACookies)
      .send({
        title: 'Build landing page hero',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-11-01',
      });
    expect(validRes.statusCode).toBe(201);
    expect(validRes.body.task.status).toBe('todo');
    expect(validRes.body.task.priority).toBe('high');
  });

  it('should enforce that task assignee must be project owner, member, or null', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({ name: 'Assignee Project' });
    const projectId = projRes.body.project._id;

    // Try assigning to User C (who is NOT in the project)
    const invalidAssigneeRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userACookies)
      .send({
        title: 'Task for outsider',
        assignee: userC._id,
      });
    expect(invalidAssigneeRes.statusCode).toBe(400);
    expect(invalidAssigneeRes.body.message).toMatch(/assignee must be either the project owner or a registered member/i);

    // Assigning to null (unassigned) is allowed
    const unassignedRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userACookies)
      .send({
        title: 'Unassigned task',
        assignee: null,
      });
    expect(unassignedRes.statusCode).toBe(201);

    // Assigning to Owner (User A) is allowed
    const ownerTaskRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userACookies)
      .send({
        title: 'Owner task',
        assignee: userA._id,
      });
    expect(ownerTaskRes.statusCode).toBe(201);
  });

  it('should allow task moving across all 4 statuses and show in My Tasks', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({ name: 'Kanban Project' });
    const projectId = projRes.body.project._id;

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Cookie', userACookies)
      .send({ email: 'bob@example.com' });

    const taskRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userACookies)
      .send({
        title: 'Implement Authentication',
        status: 'todo',
        priority: 'high',
        assignee: userB._id,
      });
    const taskId = taskRes.body.task._id;

    // Bob checks My Tasks
    const myTasksRes = await request(app)
      .get('/api/tasks/my')
      .set('Cookie', userBCookies);
    expect(myTasksRes.statusCode).toBe(200);
    expect(myTasksRes.body.tasks.some((t) => t._id === taskId)).toBe(true);

    // Bob moves task: todo -> in_progress
    const move1 = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Cookie', userBCookies)
      .send({ status: 'in_progress' });
    expect(move1.statusCode).toBe(200);
    expect(move1.body.task.status).toBe('in_progress');

    // Bob moves task: in_progress -> review
    const move2 = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Cookie', userBCookies)
      .send({ status: 'review' });
    expect(move2.statusCode).toBe(200);
    expect(move2.body.task.status).toBe('review');

    // Bob moves task: review -> completed
    const move3 = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Cookie', userBCookies)
      .send({ status: 'completed' });
    expect(move3.statusCode).toBe(200);
    expect(move3.body.task.status).toBe('completed');
  });

  it('should support adding and reading comments on a task', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({ name: 'Discussion Project' });
    const projectId = projRes.body.project._id;

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Cookie', userACookies)
      .send({ email: 'bob@example.com' });

    const taskRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userACookies)
      .send({ title: 'Task with comment' });
    const taskId = taskRes.body.task._id;

    // Bob adds a comment
    const commentRes = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Cookie', userBCookies)
      .send({ content: 'I have started testing the integration.' });

    expect(commentRes.statusCode).toBe(201);
    expect(commentRes.body.comment.content).toBe('I have started testing the integration.');
    expect(commentRes.body.comment.author.fullName).toBe('Bob Smith');

    // Alice reads comments
    const listRes = await request(app)
      .get(`/api/tasks/${taskId}/comments`)
      .set('Cookie', userACookies);
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.count).toBe(1);
    expect(listRes.body.comments[0].content).toBe('I have started testing the integration.');
  });

  it('should unassign member tasks when member is removed from project', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({ name: 'Removal Project' });
    const projectId = projRes.body.project._id;

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Cookie', userACookies)
      .send({ email: 'bob@example.com' });

    const taskRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userACookies)
      .send({
        title: 'Task for Bob',
        assignee: userB._id,
      });
    const taskId = taskRes.body.task._id;

    // Owner removes Bob
    const removeRes = await request(app)
      .delete(`/api/projects/${projectId}/members/${userB._id}`)
      .set('Cookie', userACookies);
    expect(removeRes.statusCode).toBe(200);

    // Verify task is now unassigned
    const updatedTask = await Task.findById(taskId);
    expect(updatedTask.assignee).toBeNull();
  });

  it('should cascade delete all tasks and comments when a project is deleted', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Cookie', userACookies)
      .send({ name: 'Project to be deleted' });
    const projectId = projRes.body.project._id;

    const taskRes = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Cookie', userACookies)
      .send({ title: 'Task to be deleted' });
    const taskId = taskRes.body.task._id;

    await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Cookie', userACookies)
      .send({ content: 'Comment to be deleted' });

    // Delete project
    const delRes = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Cookie', userACookies);
    expect(delRes.statusCode).toBe(200);

    // Verify Project, Task, and Comments no longer exist
    const p = await Project.findById(projectId);
    const t = await Task.findById(taskId);
    const c = await Comment.find({ task: taskId });

    expect(p).toBeNull();
    expect(t).toBeNull();
    expect(c.length).toBe(0);
  });
});

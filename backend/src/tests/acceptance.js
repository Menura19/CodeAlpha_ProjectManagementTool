const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Project = require('../models/Project');

async function runAcceptanceFlow() {
  console.log('--- STARTING SECTION 22 ACCEPTANCE VERIFICATION FLOW ---');
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'acceptance_jwt_secret_key_1234567890_test_token';

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('[Acceptance] Connected to test database.');

  try {
    // Step 1: Register User A
    console.log('Step 1: Registering User A...');
    const regA = await request(app).post('/api/auth/register').send({
      fullName: 'Alice Developer',
      email: 'alice.dev@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    if (regA.status !== 201) throw new Error(`User A registration failed: ${JSON.stringify(regA.body)}`);
    const userA = regA.body.user;
    let cookieA = regA.headers['set-cookie'];
    console.log('✓ User A registered successfully:', userA.email);

    // Step 2: Register User B
    console.log('Step 2: Registering User B...');
    const regB = await request(app).post('/api/auth/register').send({
      fullName: 'Bob Collaborator',
      email: 'bob.collab@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    if (regB.status !== 201) throw new Error(`User B registration failed: ${JSON.stringify(regB.body)}`);
    const userB = regB.body.user;
    let cookieB = regB.headers['set-cookie'];
    console.log('✓ User B registered successfully:', userB.email);

    // Step 3: Log in as User A
    console.log('Step 3: Logging in as User A...');
    const loginA = await request(app).post('/api/auth/login').send({
      email: 'alice.dev@example.com',
      password: 'password123',
    });
    if (loginA.status !== 200) throw new Error(`User A login failed`);
    cookieA = loginA.headers['set-cookie'];
    console.log('✓ User A logged in successfully.');

    // Step 4: Create a project with an optional due date
    console.log('Step 4: Creating project as User A...');
    const createProj = await request(app)
      .post('/api/projects')
      .set('Cookie', cookieA)
      .send({
        name: 'ProjectFlow Core Launch',
        description: 'End to end product delivery milestone',
        dueDate: '2026-11-15T00:00:00.000Z',
      });
    if (createProj.status !== 201) throw new Error(`Project creation failed: ${JSON.stringify(createProj.body)}`);
    const project = createProj.body.project;
    console.log('✓ Project created with ID:', project._id);

    // Step 5: Add User B using User B's exact registered email
    console.log("Step 5: Adding User B by exact email 'bob.collab@example.com'...");
    const addMember = await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set('Cookie', cookieA)
      .send({ email: 'bob.collab@example.com' });
    if (addMember.status !== 200) throw new Error(`Add member failed: ${JSON.stringify(addMember.body)}`);
    console.log('✓ User B added as Member.');

    // Step 6: Create a task with High priority, To Do status and a due date
    // Step 7: Assign the task to User B
    console.log('Step 6 & 7: Creating High priority To Do task assigned to User B...');
    const createTask = await request(app)
      .post(`/api/projects/${project._id}/tasks`)
      .set('Cookie', cookieA)
      .send({
        title: 'Design and test responsive Kanban card components',
        description: 'Implement drag-friendly layout and priority badges',
        status: 'todo',
        priority: 'high',
        assignee: userB._id,
        dueDate: '2026-11-10T00:00:00.000Z',
      });
    if (createTask.status !== 201) throw new Error(`Task creation failed: ${JSON.stringify(createTask.body)}`);
    const task = createTask.body.task;
    console.log('✓ Task created with ID:', task._id);

    // Step 8: Confirm the task appears on the project's Kanban board
    console.log("Step 8: Fetching project tasks to confirm board display...");
    const boardTasks = await request(app)
      .get(`/api/projects/${project._id}/tasks`)
      .set('Cookie', cookieA);
    const foundInTodo = boardTasks.body.tasks.find((t) => t._id === task._id && t.status === 'todo');
    if (!foundInTodo) throw new Error('Task not found in To Do column of project board');
    console.log('✓ Task confirmed on Kanban board in To Do column.');

    // Step 9: Log out and log in as User B
    console.log('Step 9: Logging out and logging in as User B...');
    await request(app).post('/api/auth/logout').set('Cookie', cookieA);
    const loginB = await request(app).post('/api/auth/login').send({
      email: 'bob.collab@example.com',
      password: 'password123',
    });
    cookieB = loginB.headers['set-cookie'];
    console.log('✓ Logged in as User B.');

    // Step 10: Confirm the joined project is visible
    console.log('Step 10: Checking User B can view the joined project...');
    const bProjects = await request(app).get('/api/projects').set('Cookie', cookieB);
    const hasProject = bProjects.body.projects.find((p) => p._id === project._id);
    if (!hasProject) throw new Error('Joined project not visible to User B');
    console.log('✓ User B can see the joined project.');

    // Step 11: Confirm the assigned task appears in My Tasks
    console.log('Step 11: Checking My Tasks for User B...');
    const myTasks = await request(app).get('/api/tasks/my').set('Cookie', cookieB);
    const hasMyTask = myTasks.body.tasks.find((t) => t._id === task._id);
    if (!hasMyTask) throw new Error('Assigned task missing from User B My Tasks');
    console.log('✓ Task verified in User B My Tasks.');

    // Step 12: Move task: todo -> in_progress -> review -> completed
    console.log('Step 12: Moving task through To Do -> In Progress -> Review -> Completed...');
    for (const nextStatus of ['in_progress', 'review', 'completed']) {
      const moveRes = await request(app)
        .patch(`/api/tasks/${task._id}/status`)
        .set('Cookie', cookieB)
        .send({ status: nextStatus });
      if (moveRes.status !== 200 || moveRes.body.task.status !== nextStatus) {
        throw new Error(`Failed to transition task to ${nextStatus}`);
      }
      console.log(`  -> Transitioned to '${nextStatus}'`);
    }

    // Step 13: Open task details and add a comment
    console.log('Step 13: Adding comment from User B...');
    const addComment = await request(app)
      .post(`/api/tasks/${task._id}/comments`)
      .set('Cookie', cookieB)
      .send({ content: 'Completed implementation and self-tested on Chrome and Firefox.' });
    if (addComment.status !== 201) throw new Error('Failed to post comment');
    console.log('✓ Comment posted by User B.');

    // Step 14: Refresh and confirm the task status and comment persist
    console.log('Step 14: Reloading task and comments from MongoDB...');
    const refreshedTask = await request(app).get(`/api/tasks/${task._id}`).set('Cookie', cookieB);
    if (refreshedTask.body.task.status !== 'completed') throw new Error('Task status was not persisted');
    const refreshedComments = await request(app).get(`/api/tasks/${task._id}/comments`).set('Cookie', cookieB);
    if (refreshedComments.body.comments.length !== 1) throw new Error('Comments were not persisted');
    console.log('✓ Verified task status (completed) and comment persisted in MongoDB.');

    // Step 15: Log in as User A and confirm the updated board, comment count and project progress
    console.log('Step 15: Logging in as User A and checking updated progress & comments...');
    const loginA2 = await request(app).post('/api/auth/login').send({
      email: 'alice.dev@example.com',
      password: 'password123',
    });
    cookieA = loginA2.headers['set-cookie'];
    const pDetails = await request(app).get(`/api/projects/${project._id}`).set('Cookie', cookieA);
    if (pDetails.body.project.progress !== 100) {
      throw new Error(`Expected project progress to be 100%, got: ${pDetails.body.project.progress}%`);
    }
    const tCheck = await request(app).get(`/api/tasks/${task._id}`).set('Cookie', cookieA);
    if (tCheck.body.task.commentCount !== 1) {
      throw new Error(`Expected commentCount to be 1, got: ${tCheck.body.task.commentCount}`);
    }
    console.log('✓ Verified User A sees 100% progress and comment count = 1.');

    // Step 16: Confirm User B cannot edit/delete the project or manage members
    console.log('Step 16: Confirming User B cannot edit/delete project or manage members...');
    const bEdit = await request(app).patch(`/api/projects/${project._id}`).set('Cookie', cookieB).send({ name: 'Hacked' });
    if (bEdit.status !== 403) throw new Error('User B was unexpectedly able to edit project');
    const bDelete = await request(app).delete(`/api/projects/${project._id}`).set('Cookie', cookieB);
    if (bDelete.status !== 403) throw new Error('User B was unexpectedly able to delete project');
    const bAddMem = await request(app).post(`/api/projects/${project._id}/members`).set('Cookie', cookieB).send({ email: 'other@example.com' });
    if (bAddMem.status !== 403) throw new Error('User B was unexpectedly able to add members');
    console.log('✓ User B authorization restrictions strictly enforced.');

    // Step 17: Remove User B and confirm any assigned project tasks become Unassigned
    console.log('Step 17: Removing User B as Owner (User A) and verifying task unassignment...');
    const remB = await request(app).delete(`/api/projects/${project._id}/members/${userB._id}`).set('Cookie', cookieA);
    if (remB.status !== 200) throw new Error('Failed to remove User B');
    const taskAfterRem = await Task.findById(task._id);
    if (taskAfterRem.assignee !== null) throw new Error('Task was not unassigned after member removal');
    console.log('✓ User B removed and task successfully unassigned.');

    // Step 18: Delete the project and confirm its tasks/comments no longer exist
    console.log('Step 18: Deleting project and checking cascading deletion of tasks & comments...');
    const delP = await request(app).delete(`/api/projects/${project._id}`).set('Cookie', cookieA);
    if (delP.status !== 200) throw new Error('Failed to delete project');
    const pGone = await Project.findById(project._id);
    const tGone = await Task.findById(task._id);
    const cGone = await Comment.find({ task: task._id });
    if (pGone !== null || tGone !== null || cGone.length !== 0) {
      throw new Error('Cascading deletion failed - records still exist');
    }
    console.log('✓ Project, tasks, and comments completely cleaned up.');

    // Step 19: Confirm no unauthorized API request can access the deleted data
    console.log('Step 19: Confirming 404 / 403 for deleted data...');
    const getGoneP = await request(app).get(`/api/projects/${project._id}`).set('Cookie', cookieA);
    if (getGoneP.status !== 404) throw new Error('Deleted project did not return 404');
    const getGoneT = await request(app).get(`/api/tasks/${task._id}`).set('Cookie', cookieA);
    if (getGoneT.status !== 404) throw new Error('Deleted task did not return 404');
    console.log('✓ Deleted records safely return 404.');

    console.log('====================================================');
    console.log('ALL SECTION 22 ACCEPTANCE FLOW CHECKS PASSED 100%!');
    console.log('====================================================');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

if (require.main === module) {
  runAcceptanceFlow()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Acceptance Flow FAILED:', err);
      process.exit(1);
    });
}

module.exports = runAcceptanceFlow;

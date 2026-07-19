import { Hono } from 'hono';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get('/todos', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM todos').all();
  return c.json(results);
});

app.post('/todos', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid JSON' }, 400);
  }

  if (typeof body.title !== 'string' || body.title.trim() === '') {
    return c.json({ error: 'title is required' }, 400);
  }

  const created = await c.env.DB.prepare(
    'INSERT INTO todos (title) VALUES (?) RETURNING *'
  )
    .bind(body.title)
    .first();

  return c.json(created, 201);
});

app.delete('/todos/:id', async (c) => {
  const id = c.req.param('id');
  const { meta } = await c.env.DB.prepare('DELETE FROM todos WHERE id = ?')
    .bind(id)
    .run();

  if (meta.changes === 0) {
    return c.json({ error: 'todo not found' }, 404);
  }

  return c.body(null, 204);
});

app.put('/todos/:id', async (c) => {
  const id = c.req.param('id');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid JSON' }, 400);
  }

  if (typeof body.completed !== 'boolean') {
    return c.json({ error: 'completed must be a boolean' }, 400);
  }

  const { meta } = await c.env.DB.prepare(
    'UPDATE todos SET completed = ? WHERE id = ?'
  )
    .bind(body.completed ? 1 : 0, id)
    .run();

  if (meta.changes === 0) {
    return c.json({ error: 'todo not found' }, 404);
  }

  return c.body(null, 204);
});

export default app;

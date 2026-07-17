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

export default app;

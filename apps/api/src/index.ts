import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const createTodoSchema = z.object({
  title: z.string().trim().min(1),
});

const updateTodoSchema = z.object({
  completed: z.boolean().transform((v) => (v ? 1 : 0)),
});

app.get('/todos', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM todos').all();
  return c.json(results);
});

app.post('/todos', zValidator('json', createTodoSchema), async (c) => {
  const { title } = c.req.valid('json');

  const created = await c.env.DB.prepare(
    'INSERT INTO todos (title) VALUES (?) RETURNING *'
  )
    .bind(title)
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

app.put('/todos/:id', zValidator('json', updateTodoSchema), async (c) => {
  const id = c.req.param('id');
  const { completed } = c.req.valid('json');

  const { meta } = await c.env.DB.prepare(
    'UPDATE todos SET completed = ? WHERE id = ?'
  )
    .bind(completed, id)
    .run();

  if (meta.changes === 0) {
    return c.json({ error: 'todo not found' }, 404);
  }

  return c.body(null, 204);
});

export default app;

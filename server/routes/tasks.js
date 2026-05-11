import express from 'express';
const router = express.Router();

export default (prisma) => {
  // Get all tasks for user/team
  router.get('/', async (req, res) => {
    try {
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { creatorId: req.user.uid },
            { assigneeId: req.user.uid }
          ]
        },
        include: { attachments: true }
      });
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Create a task
  router.post('/', async (req, res) => {
    try {
      const { title, description, priority, energyType, dueDate, workflowId } = req.body;
      const task = await prisma.task.create({
        data: {
          title,
          description,
          creatorId: req.user.uid,
          dueDate: dueDate ? new Date(dueDate) : null,
          workflowId: workflowId || null,
          // Since energyType/priority are not in the current prisma schema directly, 
          // we might want to store them in description or add them to schema later.
          // For now, assume they are handled or mapped properly. 
          // We will save description stringified if it's an object.
          description: JSON.stringify({ description, priority, energyType })
        }
      });
      res.status(201).json(task);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Update a task
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      
      // Update task
      const updatedTask = await prisma.task.update({
        where: { id },
        data
      });
      
      res.json(updatedTask);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete a task
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.task.delete({
        where: { id }
      });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  return router;
};

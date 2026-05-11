import express from 'express';
const router = express.Router();

export default (prisma) => {
  // Get messages for a group
  router.get('/:groupId', async (req, res) => {
    try {
      const { groupId } = req.params;
      const messages = await prisma.message.findMany({
        where: { groupId },
        orderBy: { createdAt: 'asc' },
        include: { sender: true }
      });
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  return router;
};

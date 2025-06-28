const prisma = require('../middlewares/prisma');

exports.getAllLinks = async (req, res) => {
  try {
    const links = await prisma.externalLink.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch links.' });
  }
};

exports.createLink = async (req, res) => {
  const { title, url } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required.' });
  }
  try {
    const newLink = await prisma.externalLink.create({
      data: { title, url }
    });
    res.status(201).json(newLink);
  } catch (error) {
    res.status(500).json({ error: 'Could not create link.' });
  }
};

exports.updateLink = async (req, res) => {
  const { id } = req.params;
  const { title, url } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required.' });
  }
  try {
    const updatedLink = await prisma.externalLink.update({
      where: { id: parseInt(id) },
      data: { title, url }
    });
    res.json(updatedLink);
  } catch (error) {
    res.status(500).json({ error: 'Could not update link.' });
  }
};

exports.deleteLink = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.externalLink.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Could not delete link.' });
  }
}; 
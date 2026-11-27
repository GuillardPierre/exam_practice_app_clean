const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// @route   GET api/tasks
// @desc    Get all user tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tasks
// @desc    Add a new task
router.post('/', auth, async (req, res) => {
  const { title, description } = req.body;

  // Un utilisateur pourrait injecter du HTML ou du script dans la description.
  try {
    const newTask = new Task({
      title,
      description,
      user: req.user.id,
    });

    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tasks/:id
// @desc    Mettre à jour une tâche appartenant à l'utilisateur connecté
router.put('/:id', auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Identifiant de tâche invalide' });
  }

  const { title, description, isCompleted } = req.body;
  const updatedFields = {};
  if (title !== undefined) updatedFields.title = title;
  if (description !== undefined) updatedFields.description = description;
  if (isCompleted !== undefined) updatedFields.isCompleted = isCompleted;

  try {
    // Filtre par utilisateur pour empêcher la modification d'une tâche appartenant à un autre compte (IDOR)
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ msg: 'Tâche introuvable' });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   DELETE api/tasks/:id
// @desc    Supprimer une tâche appartenant à l'utilisateur connecté
router.delete('/:id', auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Identifiant de tâche invalide' });
  }

  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deletedTask) {
      return res.status(404).json({ msg: 'Tâche introuvable' });
    }

    res.json({ msg: 'Tâche supprimée' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;

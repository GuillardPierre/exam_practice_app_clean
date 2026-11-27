const express = require('express');
const mongoose = require('mongoose');
const debug = require('debug')('app:tasks');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const { sanitizeTaskInput, createTaskSchema, updateTaskSchema } = require('../validators/schemas');

// @route   GET api/tasks
// @desc    Récupérer toutes les tâches de l'utilisateur connecté
router.get('/', auth, async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    debug('Récupération de %d tâche(s) pour utilisateur %s', tasks.length, req.user.id);
    return res.json(tasks);
  } catch (err) {
    return next(err);
  }
});

// @route   POST api/tasks
// @desc    Créer une nouvelle tâche
router.post('/', auth, async (req, res, next) => {
  const cleanedBody = sanitizeTaskInput(req.body);
  const { error, value } = createTaskSchema.validate(cleanedBody);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  try {
    const newTask = new Task({
      title: value.title,
      description: value.description,
      user: req.user.id,
    });

    const task = await newTask.save();
    debug('Tâche créée (%s) pour utilisateur %s', task.id, req.user.id);
    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
});

// @route   PUT api/tasks/:id
// @desc    Mettre à jour une tâche appartenant à l'utilisateur connecté
router.put('/:id', auth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Identifiant de tâche invalide.' });
  }

  const cleanedBody = sanitizeTaskInput(req.body);
  const { error, value } = updateTaskSchema.validate(cleanedBody);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  const { title, description, isCompleted } = value;
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
      return res.status(404).json({ msg: 'Tâche introuvable.' });
    }

    debug('Tâche mise à jour (%s) pour utilisateur %s', task.id, req.user.id);
    return res.json(task);
  } catch (err) {
    return next(err);
  }
});

// @route   DELETE api/tasks/:id
// @desc    Supprimer une tâche appartenant à l'utilisateur connecté
router.delete('/:id', auth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Identifiant de tâche invalide.' });
  }

  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deletedTask) {
      return res.status(404).json({ msg: 'Tâche introuvable.' });
    }

    debug('Tâche supprimée (%s) pour utilisateur %s', req.params.id, req.user.id);
    return res.json({ msg: 'Tâche supprimée.' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

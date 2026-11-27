const express = require('express');
const mongoose = require('mongoose');
const debug = require('debug')('app:tasks');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const { sanitizeTaskInput, createTaskSchema, updateTaskSchema } = require('../validators/schemas');

/**
 * GET /api/tasks
 * Retourne la liste des tâches de l'utilisateur connecté, de la plus récente à la plus ancienne.
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    debug('Récupération de %d tâche(s) pour utilisateur %s', tasks.length, req.user.id);
    return res.json(tasks);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/tasks
 * Crée une nouvelle tâche après nettoyage HTML et validation des champs.
 */
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

/**
 * PUT /api/tasks/:id
 * Met à jour une tâche existante si elle appartient à l'utilisateur connecté.
 */
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
    // On filtre sur user pour empêcher un utilisateur de modifier la tâche d'un autre compte (IDOR)
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

/**
 * DELETE /api/tasks/:id
 * Supprime une tâche si elle appartient à l'utilisateur connecté.
 */
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
